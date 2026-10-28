import { ApiError, getApiBaseUrl, type ChatMessage } from "@/lib/api";

export type StreamChatHandlers = {
  onUserMessage?: (message: ChatMessage) => void;
  onToken?: (token: string) => void;
  onThinking?: (thinking: string) => void;
  onAssistantMessage?: (message: ChatMessage) => void;
  onDone?: () => void;
  onStatus?: (status: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
};

export async function streamChatMessage(
  sessionId: string,
  content: string,
  handlers: StreamChatHandlers = {},
) {
  return consumeChatStream(
    `/chats/sessions/${sessionId}/messages`,
    { content },
    handlers,
  );
}

export async function streamChatResubmit(
  sessionId: string,
  messageId: string,
  content: string,
  handlers: StreamChatHandlers = {},
) {
  return consumeChatStream(
    `/chats/sessions/${sessionId}/messages/${messageId}/resubmit`,
    { content },
    handlers,
  );
}

export async function streamChatRegenerate(
  sessionId: string,
  handlers: StreamChatHandlers = {},
) {
  return consumeChatStream(
    `/chats/sessions/${sessionId}/regenerate`,
    {},
    handlers,
  );
}

async function consumeChatStream(
  path: string,
  body: Record<string, string>,
  handlers: StreamChatHandlers,
): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(body),
    signal: handlers.signal,
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }
  if (!response.body) throw new Error("No response body for SSE stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
    let sawDone = false;
    let sawError = false;
    let streamError: Error | null = null;
    const streamHandlers: StreamChatHandlers = {
    ...handlers,
    onError: (error) => {
      streamError = error;
      handlers.onError?.(error);
    },
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const result = dispatchEvent(part, streamHandlers);
        if (result === "done") sawDone = true;
        if (result === "error") sawError = true;
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (buffer.trim()) {
    const result = dispatchEvent(buffer, streamHandlers);
    if (result === "done") sawDone = true;
    if (result === "error") sawError = true;
  }
  if (streamError) throw streamError;
  if (!sawDone && !sawError) handlers.onDone?.();
}

function dispatchEvent(part: string, handlers: StreamChatHandlers): "done" | "error" | null {
  const lines = part.split(/\r?\n/);
  const event =
    lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ?? "message";
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""))
    .join("\n");
  if (!data && event !== "done") return null;

  let parsed: unknown = data;
  if (data) {
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = data;
    }
  }

  if (event === "status") {
    handlers.onStatus?.(typeof parsed === "string" ? parsed : String(parsed));
  } else if (event === "token") {
    const token = typeof parsed === "string" ? parsed : String(parsed);
    handlers.onToken?.(token);
  } else if (event === "thinking") {
    const thinking = typeof parsed === "string" ? parsed : String(parsed);
    handlers.onThinking?.(thinking);
  } else if (event === "user_message") {
    handlers.onUserMessage?.(parsed as ChatMessage);
  } else if (event === "assistant_message") {
    handlers.onAssistantMessage?.(parsed as ChatMessage);
  } else if (event === "error") {
    handlers.onError?.(new Error(errorMessage(parsed)));
  } else if (event === "done") {
    handlers.onDone?.();
    return "done";
  }
  return event === "error" ? "error" : null;
}

function errorMessage(parsed: unknown) {
  if (typeof parsed === "string" && parsed.trim()) return parsed;
  if (parsed && typeof parsed === "object" && "message" in parsed) {
    const message = (parsed as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "The AI response failed";
}

async function readError(response: Response) {
  try {
    const text = await response.text();
    if (!text.trim()) return `${response.status} ${response.statusText || "Request failed"}`;
    try {
      const data = JSON.parse(text) as { message?: string; error?: string };
      return data.message ?? data.error ?? text;
    } catch {
      const sse = text.match(/data:\s*(.+)/);
      if (sse?.[1]) {
        try {
          const data = JSON.parse(sse[1]) as { message?: string };
          return data.message ?? sse[1];
        } catch {
          return sse[1];
        }
      }
      return text;
    }
  } catch {
    return `${response.status} ${response.statusText || "Request failed"}`;
  }
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/components/ui/toast";
import { ApiError, api, type ChatMessage, type ChatSession } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  streamChatMessage,
  streamChatRegenerate,
  streamChatResubmit,
  type StreamChatHandlers,
} from "@/lib/stream-chat";

const SESSION_STORAGE_PREFIX = "devpilot:chat-session:";

export function lastSessionStorageKey(repositoryId: string) {
  return `${SESSION_STORAGE_PREFIX}${repositoryId}`;
}

export function useChatSessions(repositoryId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chat.sessions(repositoryId),
    queryFn: () => api.listSessions(repositoryId),
    enabled: Boolean(repositoryId) && enabled,
  });
}

export function useAllChatSessions(enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.chat.all, "sessions", "all"],
    queryFn: () => api.listAllSessions(),
    enabled,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.chat.messages(sessionId ?? ""),
    queryFn: () => api.getMessages(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useCreateChatSession(repositoryId: string) {
  const queryClient = useQueryClient();
  const invalidateAllSessions = () =>
    queryClient.invalidateQueries({ queryKey: [...queryKeys.chat.all, "sessions", "all"] });
  return useMutation({
    mutationFn: (title?: string) => api.createSession(repositoryId, title),
    onSuccess: (session) => {
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(repositoryId),
        (current = []) => [session, ...current.filter((item) => item.id !== session.id)],
      );
      void invalidateAllSessions();
    },
    onError: (error: Error) =>
      toast.add({ title: "Could not create chat", description: error.message, type: "error" }),
  });
}

export function useRenameChatSession(repositoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) =>
      api.renameSession(sessionId, title),
    onSuccess: (session) => {
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(repositoryId),
        (current = []) =>
          current.map((item) => (item.id === session.id ? session : item)),
      );
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.chat.all, "sessions", "all"],
      });
    },
    onError: (error: Error) =>
      toast.add({ title: "Could not rename chat", description: error.message, type: "error" }),
  });
}

export function useDeleteChatSession(repositoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.deleteSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({ queryKey: queryKeys.chat.messages(sessionId) });
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(repositoryId),
        (current = []) => current.filter((item) => item.id !== sessionId),
      );
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.chat.all, "sessions", "all"],
      });
    },
    onError: (error: Error) =>
      toast.add({ title: "Could not delete chat", description: error.message, type: "error" }),
  });
}

export type ChatStreamMode = "send" | "resubmit" | "regenerate";

export function useStreamChat(sessionId: string | null, repositoryId?: string) {
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamThinking, setStreamThinking] = useState("");
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const activeSessionRef = useRef(sessionId);
  const queryClient = useQueryClient();

  useEffect(() => {
    activeSessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const runStream = useCallback(
    async (
      targetSessionId: string,
      start: (handlers: StreamChatHandlers) => Promise<void>,
      options?: { replaceAfterUserId?: string; removeLastAssistant?: boolean },
    ) => {
      abortRef.current?.abort();
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      activeSessionRef.current = targetSessionId;
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);
      setStreamText("");
      setStreamThinking("");
      setStreamStatus("Preparing response...");

      const isCurrent = () =>
        generation === generationRef.current && activeSessionRef.current === targetSessionId;

      if (options?.removeLastAssistant) {
        queryClient.setQueryData<ChatMessage[]>(
          queryKeys.chat.messages(targetSessionId),
          (current = []) => {
            const lastAssistant = [...current].reverse().find((item) => item.role === "ASSISTANT");
            return lastAssistant
              ? current.filter((item) => item.id !== lastAssistant.id)
              : current;
          },
        );
      }

      const handlers: StreamChatHandlers = {
        signal: controller.signal,
        onUserMessage: (message) => {
          if (!isCurrent()) return;
          queryClient.setQueryData<ChatMessage[]>(
            queryKeys.chat.messages(targetSessionId),
            (current = []) => {
              const withoutPending = current.filter((item) => !item.id.startsWith("pending-"));
              if (options?.replaceAfterUserId) {
                const index = withoutPending.findIndex((item) => item.id === options.replaceAfterUserId);
                const kept = index >= 0 ? withoutPending.slice(0, index) : withoutPending;
                return [...kept, message];
              }
              if (withoutPending.some((item) => item.id === message.id)) {
                return withoutPending.map((item) => (item.id === message.id ? message : item));
              }
              return [...withoutPending, message];
            },
          );
        },
        onToken: (token) => {
                  if (isCurrent()) {
                    setStreamText((current) => {
                      // Ensure proper spacing between tokens
                      // If current text ends with a word character and token starts with a word character, add a space
                      if (current.length > 0 && /[\w)]$/.test(current) && /^[\w(]/.test(token)) {
                        return current + " " + token;
                      }
                      return current + token;
                    });
                  }
                },
        onThinking: (thinking) => {
          if (isCurrent()) {
            setStreamThinking((current) => current + thinking);
          }
        },
        onStatus: (status) => {
          if (isCurrent()) setStreamStatus(status);
        },
        onAssistantMessage: (message) => {
          if (!isCurrent()) return;
          queryClient.setQueryData<ChatMessage[]>(
            queryKeys.chat.messages(targetSessionId),
            (current = []) =>
              current.some((item) => item.id === message.id)
                ? current
                : [...current.filter((item) => !item.id.startsWith("pending-")), message],
          );
        },
        onDone: () => {
          if (!isCurrent()) return;
          void queryClient.invalidateQueries({
            queryKey: queryKeys.chat.messages(targetSessionId),
          });
          if (repositoryId) {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.chat.sessions(repositoryId),
            });
          }
          void queryClient.invalidateQueries({
            queryKey: [...queryKeys.chat.all, "sessions", "all"],
          });
        },
      };

      try {
        await start(handlers);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        queryClient.setQueryData<ChatMessage[]>(
          queryKeys.chat.messages(targetSessionId),
          (current = []) => current.filter((item) => !item.id.startsWith("pending-")),
        );
        toast.add({
          title: "Chat failed",
          description: userFacingError(error),
          type: "error",
        });
        throw error;
      } finally {
        if (generation === generationRef.current) {
          abortRef.current = null;
          setStreaming(false);
          setStreamText("");
          setStreamThinking("");
          setStreamStatus(null);
        }
      }
    },
    [queryClient, repositoryId],
  );

  const send = useCallback(
    async (content: string, targetSessionId = sessionId) => {
      if (!targetSessionId || !content.trim() || streaming) return;
      const optimisticMessage: ChatMessage = {
        id: `pending-${Date.now()}`,
        role: "USER",
        content: content.trim(),
        citations: [],
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(targetSessionId),
        (current = []) => [...current, optimisticMessage],
      );
      await runStream(targetSessionId, (handlers) =>
        streamChatMessage(targetSessionId, content.trim(), handlers),
      );
    },
    [queryClient, runStream, sessionId, streaming],
  );

  const resubmit = useCallback(
    async (messageId: string, content: string, targetSessionId = sessionId) => {
      if (!targetSessionId || !content.trim() || streaming) return;
      await runStream(
        targetSessionId,
        (handlers) => streamChatResubmit(targetSessionId, messageId, content.trim(), handlers),
        { replaceAfterUserId: messageId },
      );
    },
    [runStream, sessionId, streaming],
  );

  const regenerate = useCallback(
    async (targetSessionId = sessionId) => {
      if (!targetSessionId || streaming) return;
      await runStream(
        targetSessionId,
        (handlers) => streamChatRegenerate(targetSessionId, handlers),
        { removeLastAssistant: true },
      );
    },
    [runStream, sessionId, streaming],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    generationRef.current += 1;
    setStreaming(false);
    setStreamText("");
    setStreamStatus(null);
  }, []);

  return { send, resubmit, regenerate, stop, streaming, streamText, streamThinking, streamStatus };
}

function userFacingError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403) return "You do not have access to this repository.";
    if (error.status === 404) return "This conversation or repository was not found.";
    if (error.status === 429) return "Too many requests. Try again in a moment.";
    if (error.status >= 500) return "The assistant is unavailable right now.";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}

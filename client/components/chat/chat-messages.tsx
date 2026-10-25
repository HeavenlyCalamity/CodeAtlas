"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, RefreshCw } from "lucide-react";

import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatMessage } from "@/components/chat/chat-message";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage as ChatMessageType, Repository } from "@/lib/api";

export function ChatMessages({
  repo,
  messages,
  streamText,
  streamStatus,
  isLoading,
  disabled,
  onSuggestion,
  onResubmit,
  onRegenerate,
  error,
  onRetry,
}: {
  repo: Repository;
  messages: ChatMessageType[];
  streamText: string;
  streamStatus: string | null;
  isLoading: boolean;
  disabled?: boolean;
  onSuggestion: (content: string) => void;
  onResubmit: (message: ChatMessageType, content: string) => Promise<void> | void;
  onRegenerate: () => void;
  error?: unknown;
  onRetry?: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const lastAssistantId = [...messages].reverse().find((item) => item.role === "ASSISTANT")?.id;

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || !atBottom) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, streamText, streamStatus, atBottom]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={viewportRef}
        onScroll={() => {
          const node = viewportRef.current;
          if (node) {
            setAtBottom(node.scrollHeight - node.scrollTop - node.clientHeight < 64);
          }
        }}
        className="h-full overflow-y-auto"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8 lg:px-12">
          {error ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm font-medium">Could not load this conversation</p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "The message history is unavailable."}
              </p>
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RefreshCw data-icon="inline-start" />
                  Retry
                </Button>
              )}
            </div>
          ) : isLoading ? (
            <div className="space-y-3" aria-label="Loading conversation">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-3/4 rounded-2xl" />
            </div>
          ) : messages.length === 0 && !streamText ? (
            <ChatEmptyState repo={repo} onSuggestion={onSuggestion} disabled={disabled} />
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                repo={repo}
                isLastAssistant={message.id === lastAssistantId}
                disabled={disabled}
                onResubmit={onResubmit}
                onRegenerate={onRegenerate}
              />
            ))
          )}
          {streamStatus && (
            <p className="text-xs text-muted-foreground" role="status">
              {streamStatus}
            </p>
          )}
          {streamText && (
            <ChatMessage
              message={{
                id: "streaming-assistant",
                role: "ASSISTANT",
                content: streamText,
                citations: [],
                createdAt: new Date().toISOString(),
              }}
              repo={repo}
              streaming
            />
          )}
        </div>
      </div>
      {!atBottom && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-4 right-4 rounded-full"
          onClick={() => viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight })}
          aria-label="Scroll to latest message"
        >
          <ArrowDown />
        </Button>
      )}
    </div>
  );
}

"use client";

/* eslint-disable react-hooks/set-state-in-effect -- legitimate patterns for SSR hydration and prop-driven state sync */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ArrowDown, RefreshCw } from "lucide-react";

import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatThinkingPanel, type ThinkingEvent } from "@/components/chat/chat-thinking-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage as ChatMessageType, Repository } from "@/lib/api";

export function ChatMessages({
  repo,
  messages,
  streamText,
  streamThinking,
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
  streamThinking: string;
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
  const atBottomRef = useRef(true);
  const lastAssistantId = [...messages].reverse().find((item) => item.role === "ASSISTANT")?.id;
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [thinkingStartTime, setThinkingStartTime] = useState<number>(0);
  const [thinkingEvents, setThinkingEvents] = useState<ThinkingEvent[]>([]);
  const [elapsedMs, setElapsedMs] = useState<number | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);

    // Get the last 2 user message IDs for edit eligibility
    const editableUserMessageIds = useMemo(() => {
      const userMessages = messages.filter((m) => m.role === "USER");
      return userMessages.slice(-2).map((m) => m.id);
    }, [messages]);

    // Compute thinking events from stream status and thinking content (derived state)
    const computedThinkingEvents = useMemo(() => {
      const events: ThinkingEvent[] = [];
      // eslint-disable-next-line react-hooks/purity -- Date.now() in derived computation is acceptable
      const now = Date.now();

    // Add request submitted and processing events when streaming starts
    if (streamText === "" && streamThinking === "" && streamStatus === "Preparing response...") {
      const startTime = thinkingStartTime || now;
      events.push(
        {
          id: `status-request_submitted-${startTime}`,
          stage: "request_submitted",
          message: "Request submitted",
          timestamp: startTime,
          completed: true,
        },
        {
          id: `status-processing_request-${startTime}`,
          stage: "processing_request",
          message: "Processing request",
          timestamp: startTime + 50,
          completed: false,
        }
      );
    }

    // Map stream status to thinking events
    if (streamStatus) {
      const stageMap: Record<string, ThinkingEvent["stage"]> = {
        "Understanding the request...": "processing_request",
        "Analyzing your question...": "processing_request",
        "Processing the context...": "processing_request",
        "Searching the repository...": "retrieving_context",
        "Finding relevant code...": "retrieving_context",
        "Scanning the codebase...": "retrieving_context",
        "Looking up references...": "retrieving_context",
        "Researching the source...": "retrieving_context",
        "Analyzing code patterns...": "retrieving_context",
        "Gathering context...": "retrieving_context",
        "Thinking…": "generating_response",
        "Generating response...": "generating_response",
        "Crafting the answer...": "generating_response",
        "Formulating the reply...": "generating_response",
      };

      const stage = stageMap[streamStatus] ?? "processing_request";
      events.push({
        id: `status-${stage}-${now}`,
        stage,
        message: streamStatus,
        timestamp: now,
      });
    }

    // Track thinking content as a separate event
    if (streamThinking) {
      events.push({
        id: `thinking-${now}`,
        stage: "generating_response",
        message: "Generating response",
        timestamp: now,
        completed: false,
      });
    }

    return events;
  }, [streamStatus, streamThinking, streamText, thinkingStartTime]);

  // Update thinking events state when computed events change (stable reference)
  useEffect(() => {
    setThinkingEvents(computedThinkingEvents);
  }, [computedThinkingEvents]);

  // Update streaming state
  useEffect(() => {
    const streaming = streamText.length > 0 || streamThinking.length > 0 || streamStatus !== null;
    setIsStreaming(streaming);
  }, [streamText, streamThinking, streamStatus]);

  // Track thinking start time
  useEffect(() => {
    if (streamText === "" && streamThinking === "" && streamStatus === "Preparing response...") {
      setThinkingStartTime(Date.now());
    }
  }, [streamStatus, streamText, streamThinking]);

  // Update elapsed time while streaming
  useEffect(() => {
    if (!isStreaming || thinkingStartTime === 0) {
      setElapsedMs(undefined);
      return;
    }

    const updateElapsed = () => {
      setElapsedMs(Date.now() - thinkingStartTime);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 100);
    return () => clearInterval(interval);
  }, [isStreaming, thinkingStartTime]);

  // Auto-scroll to bottom when new content arrives (only if user is at bottom)
  useEffect(() => {
    const node = viewportRef.current;
    if (!node || !atBottomRef.current) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, streamText, streamThinking, streamStatus]);

  // Debounced scroll handler to prevent infinite re-render loop
  const handleScroll = useCallback(() => {
    const node = viewportRef.current;
    if (!node) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const isAtBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 64;
      atBottomRef.current = isAtBottom;
      setAtBottom((prev) => {
        if (prev === isAtBottom) return prev;
        return isAtBottom;
      });
    }, 50);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={viewportRef}
        onScroll={handleScroll}
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
          ) : messages.length === 0 && !streamText && !streamThinking ? (
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
                isEditable={message.role === "USER" && editableUserMessageIds.includes(message.id)}
              />
            ))
          )}

          {/* Thinking Panel */}
          {(streamThinking || streamStatus || streamText) && (
            <ChatThinkingPanel
              events={thinkingEvents}
              isActive={isStreaming}
              elapsedMs={elapsedMs}
            />
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
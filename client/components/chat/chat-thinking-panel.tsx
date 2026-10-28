"use client";

/* eslint-disable react-hooks/set-state-in-effect -- legitimate patterns for SSR hydration and prop-driven state sync */
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThinkingStage =
  | "request_submitted"
  | "processing_request"
  | "retrieving_context"
  | "generating_response"
  | "completed"
  | "cancelled"
  | "error";

export interface ThinkingEvent {
  id: string;
  stage: ThinkingStage;
  message: string;
  timestamp: number;
  completed?: boolean;
}

const STAGE_CONFIG: Record<ThinkingStage, { label: string; icon: React.ReactNode }> = {
  request_submitted: { label: "Request sent", icon: <Check className="size-4 text-green-500" /> },
  processing_request: { label: "Understanding request", icon: <Loader2 className="size-4 animate-spin text-blue-500" /> },
  retrieving_context: { label: "Searching repository", icon: <Loader2 className="size-4 animate-spin text-blue-500" /> },
  generating_response: { label: "Generating answer", icon: <Loader2 className="size-4 animate-spin text-blue-500" /> },
  completed: { label: "Completed", icon: <Check className="size-4 text-green-500" /> },
  cancelled: { label: "Cancelled", icon: <X className="size-4 text-orange-500" /> },
  error: { label: "Error", icon: <X className="size-4 text-red-500" /> },
};

const STAGE_ORDER: ThinkingStage[] = [
  "request_submitted",
  "processing_request",
  "retrieving_context",
  "generating_response",
];

interface ChatThinkingPanelProps {
  events: ThinkingEvent[];
  isActive: boolean;
  elapsedMs?: number;
  onToggle?: () => void;
  onDismiss?: () => void;
}

export function ChatThinkingPanel({
  events,
  isActive,
  elapsedMs,
  onToggle,
  onDismiss,
}: ChatThinkingPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Mount effect for SSR hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
    onToggle?.();
  }, [onToggle]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleExpanded();
      }
    },
    [toggleExpanded],
  );

  const formatDuration = useCallback((ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  const getStageStatus = useCallback(
    (stage: ThinkingStage) => {
      const currentStageIndex = STAGE_ORDER.findIndex((s) => {
        const event = events.find((e) => e.stage === s && !e.completed);
        return event !== undefined;
      });

      const stageIndex = STAGE_ORDER.indexOf(stage);
      if (stageIndex === -1) return "pending";

      if (currentStageIndex === -1) {
        return "completed";
      }
      if (stageIndex < currentStageIndex) return "completed";
      if (stageIndex === currentStageIndex) return "active";
      return "pending";
    },
    [events],
  );

  // Don't render until mounted (SSR hydration)
  if (!mounted || events.length === 0) return null;

  const hasCompleted = events.some((e) => e.stage === "completed" || e.stage === "cancelled" || e.stage === "error");
  const latestEvent = events[events.length - 1];

  return (
    <div
      ref={panelRef}
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all duration-200",
        expanded ? "border-border shadow-lg" : "border-transparent",
      )}
      role="region"
      aria-label="Assistant activity"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-3 p-2.5",
          "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "transition-colors",
        )}
        aria-expanded={expanded}
        aria-controls="thinking-panel-content"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {isActive && !hasCompleted ? (
              <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
            ) : hasCompleted && latestEvent?.stage === "error" ? (
              <X className="h-3.5 w-3.5 text-red-500" />
            ) : hasCompleted && latestEvent?.stage === "cancelled" ? (
              <X className="h-3.5 w-3.5 text-orange-500" />
            ) : (
              <Check className="h-3.5 w-3.5 text-green-500" />
            )}
          </span>
          <span className="text-sm font-medium truncate">
            {isActive && !hasCompleted ? "Thinking" : hasCompleted ? "Completed" : "Activity"}
          </span>
          {(elapsedMs !== undefined || hasCompleted) && (
            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
              {formatDuration(elapsedMs ?? 0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onDismiss && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span
            className={cn(
              "p-1 rounded transition-transform duration-200",
              expanded ? "rotate-180" : "rotate-0",
            )}
            aria-hidden="true"
          >
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </span>
        </div>
      </button>

      <div
        id="thinking-panel-content"
        ref={contentRef}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
        style={{
          maxHeight: expanded ? "384px" : "0",
        }}
        aria-hidden={!expanded}
      >
        <div className="px-3 pb-3 pt-1 space-y-1.5 max-h-[384px] overflow-y-auto" role="list">
          {STAGE_ORDER.map((stage) => {
            const event = events.find((e) => e.stage === stage);
            const status = getStageStatus(stage);
            const config = STAGE_CONFIG[stage];

            if (!event && status === "pending") return null;

            return (
              <div
                key={stage}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors duration-150",
                  status === "completed" && "text-muted-foreground",
                  status === "active" && "text-foreground",
                  status === "pending" && "text-muted-foreground/50",
                )}
                role="listitem"
                aria-current={status === "active" ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center",
                    status === "completed" && "text-green-500",
                    status === "active" && "text-primary",
                    status === "pending" && "text-muted-foreground/30",
                  )}
                  aria-hidden="true"
                >
                  {status === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : status === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-current/30" />
                  )}
                </span>
                <span className="flex-1 min-w-0 leading-6 truncate">{config.label}</span>
                {event && (
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap shrink-0">
                    {formatDuration(event.timestamp - events[0].timestamp)}
                  </span>
                )}
              </div>
            );
          })}

          {events
            .filter((e) => !STAGE_ORDER.includes(e.stage))
            .map((event) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-center gap-2 text-sm text-muted-foreground",
                  event.completed ? "" : "text-foreground",
                )}
                role="listitem"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/30" aria-hidden="true">
                  {event.completed ? <Check className="h-4 w-4 text-green-500" /> : <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </span>
                <span className="flex-1 min-w-0 leading-6 truncate">{event.message}</span>
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap shrink-0">
                  {formatDuration(event.timestamp - events[0].timestamp)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
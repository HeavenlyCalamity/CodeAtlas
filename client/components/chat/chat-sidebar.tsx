"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import type { ChatSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ChatSidebar({
  sessions,
  sessionsLoading,
  sessionsError,
  sessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  onRetry,
  compact = false,
}: {
  sessions: ChatSession[];
  sessionsLoading?: boolean;
  sessionsError?: boolean;
  sessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (session: ChatSession) => void;
  onDeleteSession: (session: ChatSession) => void;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return sessions;
    return sessions.filter((session) =>
      `${session.title} ${session.repositoryName ?? ""}`.toLowerCase().includes(value),
    );
  }, [query, sessions]);

  return (
    <div className={cn("flex min-h-0 flex-col", compact ? "h-full" : "h-full")}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-3">
        <h2 className="text-sm font-semibold">Conversations</h2>
        <Button size="icon-sm" variant="outline" onClick={onCreateSession} aria-label="New conversation">
          <Plus />
        </Button>
      </div>
      <div className="shrink-0 px-3 py-2">
        <label htmlFor="conversation-search" className="sr-only">
          Search conversations
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
          <Input
            id="conversation-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="h-8 rounded-xl pl-8"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {sessionsLoading ? (
          <div className="space-y-2 px-1 py-2">
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : sessionsError ? (
          <div className="space-y-2 px-2 py-4">
            <p className="text-xs text-destructive">
              Conversation history could not be loaded.
            </p>
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw data-icon="inline-start" />
                Retry
              </Button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-4 text-xs leading-relaxed text-muted-foreground">
            {sessions.length === 0
              ? "No conversations yet. Send a message to start one."
              : "No conversations match that search."}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((session) => {
              const active = session.id === sessionId;
              return (
                <li key={session.id}>
                  <div
                    className={cn(
                      "flex items-center rounded-xl",
                      active ? "bg-muted" : "hover:bg-muted/70",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSession(session.id)}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                      aria-current={active ? "true" : undefined}
                    >
                      <span className="block truncate text-sm font-medium">
                        {session.title || "New conversation"}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {session.repositoryName || "Repository"} · {formatSessionDate(session.createdAt)}
                      </span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="mr-1"
                            aria-label={`Conversation actions for ${session.title}`}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRenameSession(session)}>
                          <Pencil /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteSession(session)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatSessionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

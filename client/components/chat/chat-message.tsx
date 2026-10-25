"use client";

import { useState } from "react";
import { Check, Copy, Pencil, RefreshCw, X } from "lucide-react";

import { CitationChips } from "@/components/chat/citation-chips";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage as ChatMessageType, Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ChatMessage({
  message,
  repo,
  streaming = false,
  isLastAssistant = false,
  disabled = false,
  onResubmit,
  onRegenerate,
}: {
  message: ChatMessageType;
  repo?: Repository;
  streaming?: boolean;
  isLastAssistant?: boolean;
  disabled?: boolean;
  onResubmit?: (message: ChatMessageType, content: string) => Promise<void> | void;
  onRegenerate?: () => void;
}) {
  const user = message.role === "USER";
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <article className={cn("group flex w-full gap-3", user ? "justify-end" : "justify-start")}>
      <div className={cn("flex min-w-0 max-w-[min(100%,44rem)] flex-col gap-2", user && "items-end")}>
        <div className="px-1 text-[11px] font-medium text-muted-foreground">
          {user ? "You" : "DevPilot"}
        </div>
        <div
          className={cn(
            "w-fit max-w-full rounded-2xl px-4 py-3 text-sm",
            user ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border bg-card",
          )}
        >
          {editing ? (
            <div className="flex min-w-64 flex-col gap-2">
              <label htmlFor={`edit-${message.id}`} className="sr-only">
                Edit message
              </label>
              <Textarea
                id={`edit-${message.id}`}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="min-h-20 bg-background text-foreground"
              />
              <div className="flex justify-end gap-1">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => {
                    setValue(message.content);
                    setEditing(false);
                  }}
                  aria-label="Cancel edit"
                >
                  <X />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled={!value.trim() || disabled}
                  onClick={async () => {
                    await onResubmit?.(message, value.trim());
                    setEditing(false);
                  }}
                  aria-label="Save and resubmit"
                >
                  <Check />
                </Button>
              </div>
            </div>
          ) : user ? (
            <p className="whitespace-pre-wrap break-words leading-6">{message.content}</p>
          ) : (
            <ChatMarkdown content={message.content} streaming={streaming} />
          )}
        </div>
        <div
          className={cn(
            "flex flex-wrap items-center gap-1",
            user && "flex-row-reverse",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
          )}
        >
          {user && onResubmit && !editing && (
            <Button
              size="icon-xs"
              variant="ghost"
              disabled={disabled}
              onClick={() => setEditing(true)}
              aria-label="Edit and resubmit"
            >
              <Pencil />
            </Button>
          )}
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy message"}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
          {!user && isLastAssistant && onRegenerate && (
            <Button
              size="icon-xs"
              variant="ghost"
              disabled={disabled}
              onClick={onRegenerate}
              aria-label="Regenerate response"
            >
              <RefreshCw />
            </Button>
          )}
        </div>
        {!user && <CitationChips citations={message.citations} repo={repo} />}
      </div>
    </article>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
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
  isEditable = false,
}: {
  message: ChatMessageType;
  repo?: Repository;
  streaming?: boolean;
  isLastAssistant?: boolean;
  disabled?: boolean;
  onResubmit?: (message: ChatMessageType, content: string) => Promise<void> | void;
  onRegenerate?: () => void;
  isEditable?: boolean;
}) {
  const user = message.role === "USER";
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const canEdit = user && isEditable && onResubmit && !disabled;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  }, [value]);

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
                                                                                                      <div className="flex flex-col gap-2 rounded-xl p-3 min-w-[280px] max-w-[44rem] shadow-sm bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800">
                                                                <div className="flex items-center justify-between">
                                                                                                          <div className="flex items-center gap-2 text-xs font-medium">
                                                                    <Pencil className="size-3.5" />
                                                                    <span>Editing message</span>
                                                                  </div>
                                                                                                          <span className="text-xs text-gray-500 dark:text-gray-400">Press Enter to save, Esc to cancel</span>
                                                                </div>
                                                                <Textarea
                                                                  ref={textareaRef}
                                                                  id={`edit-${message.id}`}
                                                                  value={value}
                                                                  onChange={(event) => setValue(event.target.value)}
                                                                  onKeyDown={(e) => {
                                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                                      e.preventDefault();
                                                                      if (value.trim() && !disabled) {
                                                                        onResubmit?.(message, value.trim());
                                                                        setEditing(false);
                                                                      }
                                                                    } else if (e.key === "Escape") {
                                                                      setValue(message.content);
                                                                      setEditing(false);
                                                                    }
                                                                  }}
                                                                                                          className="w-full min-h-[100px] max-h-[300px] resize-none rounded-lg border-none bg-transparent px-0 py-1 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:ring-0"
                                                                  placeholder="Edit your message..."
                                                                  autoFocus
                                                                />
                                                                                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                                                                  <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                      setValue(message.content);
                                                                      setEditing(false);
                                                                    }}
                                                                    aria-label="Cancel edit"
                                                                                                            className="h-8 rounded-4xl border border-gray-200 dark:border-gray-800 px-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-900"
                                                                  >
                                                                    <X className="size-4 mr-1" />
                                                                    <span>Cancel</span>
                                                                  </Button>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    disabled={!value.trim() || disabled}
                                                                    onClick={async () => {
                                                                      await onResubmit?.(message, value.trim());
                                                                      setEditing(false);
                                                                    }}
                                                                    aria-label="Save and resubmit"
                                                                                        className="h-8 rounded-4xl bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/80"
                                                                                      >
                                                                                        <Check className="size-4 mr-1" />
                                                                                        <span>Save & Resubmit</span>
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
                    {canEdit && !editing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => setEditing(true)}
                        aria-label="Edit and resubmit"
                        className="h-8 w-8 rounded-lg"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={copy}
                      aria-label={copied ? "Copied" : "Copy message"}
                      className="h-8 w-8 rounded-lg"
                    >
                      {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                    </Button>
                    {!user && isLastAssistant && onRegenerate && (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={disabled}
                        onClick={onRegenerate}
                        aria-label="Regenerate response"
                        className="h-8 w-8 rounded-lg"
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                    )}
        </div>
        {!user && <CitationChips citations={message.citations} repo={repo} />}
      </div>
    </article>
  );
}

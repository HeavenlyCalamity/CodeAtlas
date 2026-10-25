"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Send, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";

const MAX_LENGTH = 12000;

export function ChatComposer({
  disabled,
  streaming,
  onSend,
  onStop,
}: {
  disabled: boolean;
  streaming: boolean;
  onSend: (content: string) => Promise<void> | void;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = disabled || streaming || sending;
  const canSubmit = !busy && Boolean(value.trim());

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 200 ? "auto" : "hidden";
  }, [value]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = value.trim();
    if (!content || busy) return;
    setSending(true);
    setValue("");
    try {
      await onSend(content);
    } catch {
      setValue(content);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="shrink-0 border-t bg-background/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
        <div className="flex items-end gap-2 rounded-[1.35rem] border border-border/80 bg-card p-2 shadow-sm transition-shadow focus-within:border-ring focus-within:shadow-md focus-within:ring-3 focus-within:ring-ring/20">
          <label htmlFor="chat-composer" className="sr-only">
            Message
          </label>
          <Textarea
            id="chat-composer"
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? "Indexing must finish before chatting"
                : "Ask about this repository..."
            }
            rows={1}
            maxLength={MAX_LENGTH}
            className="max-h-[180px] min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-[15px] leading-6 shadow-none focus-visible:ring-0"
          />
          {streaming ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Square />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!canSubmit}
              aria-label="Send message"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
        <p className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
          <Kbd>Enter</Kbd>
          <span>to send</span>
          <Kbd>Shift</Kbd>
          <span>+</span>
          <Kbd>Enter</Kbd>
          <span>for a new line</span>
        </p>
      </div>
    </form>
  );
}

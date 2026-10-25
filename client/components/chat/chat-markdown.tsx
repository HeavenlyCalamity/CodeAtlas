"use client";

import { Streamdown } from "streamdown";

import { cn } from "@/lib/utils";
import "./chat-markdown.css";

export function ChatMarkdown({
  content,
  className,
  streaming = false,
}: {
  content: string;
  className?: string;
  streaming?: boolean;
}) {
  return (
    <div className={cn("chat-markdown min-w-0", className)}>
      <Streamdown
        mode={streaming ? "streaming" : "static"}
        isAnimating={streaming}
        className="min-w-0"
        shikiTheme={["github-light", "github-dark"]}
        lineNumbers={false}
        controls={{ table: true, code: true }}
      >
        {content}
      </Streamdown>
    </div>
  );
}

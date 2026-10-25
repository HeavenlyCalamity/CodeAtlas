"use client";

import { FileCode2 } from "lucide-react";

import type { Repository } from "@/lib/api";

const SUGGESTIONS = [
  "Explain this repository's architecture.",
  "Give me a guided tour of the codebase.",
  "Where are the main application entry points?",
  "Explain the authentication flow.",
  "Trace an important API request.",
  "Help me investigate a bug.",
];

export function ChatEmptyState({
  repo,
  onSuggestion,
  disabled,
}: {
  repo: Repository;
  onSuggestion: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-2 py-10 text-center sm:py-16">
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border bg-card text-foreground">
        <FileCode2 className="size-5" />
      </div>
      <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        Understand your codebase.
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Ask questions, explore architecture, and trace how your repository works.
        Answers stay grounded in {repo.fullName}.
      </p>
      <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestion(suggestion)}
            className="rounded-xl border bg-card px-3.5 py-3 text-left text-sm leading-5 text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

export function ChatErrorState({ error }: { error: unknown }) {
  const status = error instanceof ApiError ? error.status : 0;
  const unauthorized = status === 401 || status === 403;
  const title = unauthorized ? "Access denied" : status === 404 ? "Repository not found" : "Repository unavailable";
  const description = unauthorized
    ? "You do not have access to this repository."
    : error instanceof Error
      ? error.message
      : "Repository not found";

  return (
    <AppShell title={title} contentClassName="p-0">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    </AppShell>
  );
}

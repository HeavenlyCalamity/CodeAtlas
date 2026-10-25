"use client";

import { ExternalLink, GitBranch, Lock, PanelLeft, PanelRight, Unlock } from "lucide-react";

import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Repository } from "@/lib/api";

export function ChatHeader({
  repo,
  onOpenConversations,
  conversationsOpen,
  onToggleConversations,
}: {
  repo: Repository;
  onOpenConversations: () => void;
  conversationsOpen: boolean;
  onToggleConversations: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-background px-4 py-2.5 text-xs sm:px-6">
      <Button
        size="icon-sm"
        variant="ghost"
        className="md:hidden"
        onClick={onOpenConversations}
        aria-label="Open conversations"
      >
        <PanelLeft />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        className="hidden md:inline-flex"
        onClick={onToggleConversations}
        aria-label={conversationsOpen ? "Hide conversation history" : "Show conversation history"}
        aria-expanded={conversationsOpen}
      >
        {conversationsOpen ? <PanelLeft /> : <PanelRight />}
      </Button>
      <span className="font-medium text-foreground">{repo.owner}</span>
      <span className="text-muted-foreground">/</span>
      <span className="font-medium text-foreground">{repo.name}</span>
      <Badge variant="outline" className="gap-1 font-normal">
        <GitBranch className="size-3" />
        {repo.defaultBranch || "main"}
      </Badge>
      {repo.language && (
        <Badge variant="outline" className="font-normal">
          {repo.language}
        </Badge>
      )}
      <Badge variant="outline" className="gap-1 font-normal">
        {repo.isPrivate ? <Lock className="size-3" /> : <Unlock className="size-3" />}
        {repo.isPrivate ? "Private" : "Public"}
      </Badge>
      {(repo.filesTotal > 0 || repo.chunkCount > 0) && (
        <span className="hidden text-muted-foreground sm:inline">
          {repo.filesTotal.toLocaleString()} files · {repo.chunkCount.toLocaleString()} chunks
        </span>
      )}
      <span className="ml-auto flex items-center gap-2">
        <IndexStatusBadge status={repo.indexStatus} />
        {repo.htmlUrl && (
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            render={<a href={repo.htmlUrl} target="_blank" rel="noreferrer" />}
            aria-label="Open GitHub repository"
          >
            <ExternalLink />
          </Button>
        )}
      </span>
    </div>
  );
}

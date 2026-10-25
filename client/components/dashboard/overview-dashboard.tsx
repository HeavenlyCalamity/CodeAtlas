"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, BookOpen, FolderGit2, GitBranch, Sparkles } from "lucide-react";
import { useRepos } from "@/hooks/use-repo";
import { useAllChatSessions } from "@/hooks/use-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IndexStatusBadge } from "@/components/dashboard/repo-status";

export function OverviewDashboard() {
  const { data: repositories = [], isLoading } = useRepos();
  const sessionsQuery = useAllChatSessions();
  const indexedFiles = repositories.reduce(
    (total, repository) => total + repository.filesProcessed,
    0,
  );
  const readyRepositories = repositories.filter(
    (repository) => repository.indexStatus === "READY",
  ).length;
  const totalChunks = repositories.reduce((total, repository) => total + repository.chunkCount, 0);
  const indexingRepositories = repositories.filter(
    (repository) => repository.indexStatus === "INDEXING" || repository.indexStatus === "PENDING",
  ).length;
  const recentSessions = (sessionsQuery.data ?? []).slice(0, 5);

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 md:p-8">
      <div>
        <p className="text-sm text-muted-foreground">Your workspace at a glance</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Good to see you.</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <OverviewStat
        icon={<GitBranch className="size-5 text-primary" />}
        label="Connected repositories"
        value={isLoading ? "—" : repositories.length.toString()}
      />
      <OverviewStat
        icon={<BookOpen className="size-5 text-primary" />}
        label="Indexed chunks"
        value={isLoading ? "—" : totalChunks.toLocaleString()}
      />
      <OverviewStat
        icon={<BookOpen className="size-5 text-primary" />}
        label="Indexed files"
        value={isLoading ? "—" : indexedFiles.toLocaleString()}
      />
      <div className="rounded-2xl border bg-card p-5">
        <Activity className="mb-4 size-5 text-primary" />
        <p className="text-sm text-muted-foreground">Ready for AI chat</p>
        <p className="mt-1 text-3xl font-semibold">
          {isLoading ? "—" : readyRepositories}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="size-3" />
          {readyRepositories ? "Your indexed repositories are ready" : "Index a repository to begin"}
        </span>
      </div>
      <OverviewStat
        icon={<Activity className="size-5 text-primary" />}
        label="Currently indexing"
        value={isLoading ? "—" : indexingRepositories.toString()}
      />
      </div>
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 className="font-semibold">Repositories</h3>
            <p className="text-sm text-muted-foreground">Open an indexed repository to start chatting.</p>
          </div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
            View all <ArrowUpRight data-icon="inline-end" />
          </Button>
        </div>
        <div className="divide-y">
          {isLoading ? (
            [1, 2, 3].map((item) => <Skeleton key={item} className="mx-5 my-4 h-12" />)
          ) : repositories.length ? (
            repositories.slice(0, 6).map((repository) => (
              <div key={repository.id} className="flex items-center gap-3 px-5 py-4">
                <FolderGit2 className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{repository.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {repository.filesProcessed.toLocaleString()} files · {repository.chunkCount.toLocaleString()} chunks
                  </p>
                </div>
                <IndexStatusBadge status={repository.indexStatus} />
                {repository.indexStatus === "READY" && (
                  <Button size="icon-sm" variant="ghost" nativeButton={false} render={<Link href={`/chat/${repository.id}`} />} aria-label={`Open ${repository.fullName}`}>
                    <ArrowUpRight />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Connect a repository to start building your workspace.
            </div>
          )}
        </div>
      </div>
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 className="font-semibold">Recent conversations</h3>
            <p className="text-sm text-muted-foreground">Pick up where you left off across your repositories.</p>
          </div>
          <Badge variant="secondary">{sessionsQuery.data?.length ?? 0} total</Badge>
        </div>
        {sessionsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-10 w-full" />)}
          </div>
        ) : recentSessions.length ? (
          <div className="divide-y">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center gap-3 px-5 py-3.5">
                <Sparkles className="size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{session.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{session.repositoryName}</p>
                </div>
                <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={`/chat/${session.repositoryId}?session=${session.id}`} />}>
                  Open <ArrowUpRight data-icon="inline-end" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Your conversations will appear here after your first question.</p>
        )}
      </div>
    </section>
  );
}

function OverviewStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4">{icon}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

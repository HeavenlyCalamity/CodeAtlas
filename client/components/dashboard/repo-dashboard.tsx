"use client";

import { useMemo, useState } from "react";
import { FolderGit2, RefreshCw } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RepoCard } from "@/components/dashboard/repo-card";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useRefreshRepos, useRepos } from "@/hooks/use-repo";
import type { IndexStatus } from "@/lib/api";

type FilterStatus = "ALL" | IndexStatus;

export function RepoDashboard() {
  const reposQuery = useRepos();
  const refresh = useRefreshRepos();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FilterStatus>("ALL");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">("all");

  const repositories = useMemo(() => reposQuery.data ?? [], [reposQuery.data]);
  const matchingRepositories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return repositories.filter((repo) => {
      if (status !== "ALL" && repo.indexStatus !== status) return false;
      if (!query) return true;
      return [repo.fullName, repo.description ?? "", repo.language ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [repositories, search, status]);

  const filtered = useMemo(() => {
    return matchingRepositories.filter((repo) => {
      if (visibility === "private") return repo.isPrivate;
      if (visibility === "public") return !repo.isPrivate;
      return true;
    });
  }, [matchingRepositories, visibility]);

  const readyCount = repositories.filter((repo) => repo.indexStatus === "READY").length;
  const publicCount = matchingRepositories.filter((repo) => !repo.isPrivate).length;
  const privateCount = matchingRepositories.filter((repo) => repo.isPrivate).length;

  return (
    <div className="flex min-h-full w-full min-w-0 flex-col overflow-x-hidden">
      <DashboardHeader
        search={search}
        onSearchChange={setSearch}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        status={status}
        onStatusChange={setStatus}
        totalCount={repositories.length}
        readyCount={readyCount}
        publicCount={publicCount}
        privateCount={privateCount}
        onSync={() => refresh.mutate()}
        isSyncing={refresh.isPending}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-x-hidden bg-muted/20 p-4 md:p-8">
        {reposQuery.isLoading && (
          <div className="mx-auto grid w-full max-w-[1600px] min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-[23rem] rounded-2xl" />
            ))}
          </div>
        )}

        {reposQuery.isError && (
          <Empty className="min-h-72 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><FolderGit2 /></EmptyMedia>
              <EmptyTitle>Couldn&apos;t load repositories</EmptyTitle>
              <EmptyDescription>{reposQuery.error.message}</EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => void reposQuery.refetch()}>
              <RefreshCw /> Try again
            </Button>
          </Empty>
        )}

        {reposQuery.isSuccess && filtered.length === 0 && (
          <Empty className="min-h-72 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><FolderGit2 /></EmptyMedia>
              <EmptyTitle>{repositories.length ? "No repositories match" : "No repositories yet"}</EmptyTitle>
              <EmptyDescription>
                {repositories.length
                  ? "Try clearing your filters or changing the search."
                  : "Sync with GitHub to load your repositories here."}
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => refresh.mutate()} disabled={refresh.isPending}>
              <RefreshCw className={refresh.isPending ? "animate-spin" : undefined} /> Sync repositories
            </Button>
          </Empty>
        )}

        {reposQuery.isSuccess && filtered.length > 0 && (
          <div className="mx-auto grid w-full max-w-[1600px] min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
            {filtered.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
          </div>
        )}
      </div>
    </div>
  );
}

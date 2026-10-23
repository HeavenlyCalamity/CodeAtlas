"use client";

import type { ReactNode } from "react";
import { Activity, BookOpen, GitBranch, Sparkles } from "lucide-react";
import { useRepos } from "@/hooks/use-repo";

export function OverviewDashboard() {
  const { data: repositories = [], isLoading } = useRepos();
  const indexedFiles = repositories.reduce(
    (total, repository) => total + repository.filesProcessed,
    0,
  );
  const readyRepositories = repositories.filter(
    (repository) => repository.indexStatus === "READY",
  ).length;

  return (
    <section className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
      <OverviewStat
        icon={<GitBranch className="size-5 text-primary" />}
        label="Connected repositories"
        value={isLoading ? "—" : repositories.length.toString()}
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

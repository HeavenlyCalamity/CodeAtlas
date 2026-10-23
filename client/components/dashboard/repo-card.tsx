"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  Check,
  CircleDashed,
  GitBranch,
  Lock,
  MessageSquare,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { IndexErrorAlert } from "@/components/dashboard/index-error-alert";
import { LanguageBadge } from "@/components/dashboard/language-badge";
import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import { GithubIcon } from "@/components/icons/github-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getRepoProgress, useStartIndexing } from "@/hooks/use-repo";
import type { Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

export function RepoCard({ repo }: { repo: Repository }) {
  const router = useRouter();
  const mutation = useStartIndexing();
  const ready = repo.indexStatus === "READY";
  const indexing = repo.indexStatus === "INDEXING";
  const failed = repo.indexStatus === "FAILED";
  const progress = getRepoProgress(repo);

  function handleAction() {
    if (ready) {
      router.push(`/chat/${repo.id}`);
    } else {
      mutation.mutate(repo.id);
    }
  }

  return (
    <article className="group flex min-w-0 select-none caret-transparent flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="mx-3 mt-3 flex min-w-0 items-center gap-4 rounded-xl border bg-muted/25 px-4 py-[1.625rem]">
        <LanguageBadge language={repo.language} showLabel={false} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{repo.owner}</p>
          <h3 className="truncate font-semibold">{repo.name}</h3>
        </div>
        <div className="shrink-0">
          <IndexStatusBadge status={repo.indexStatus} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-4 pb-4 pt-6">
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {repo.description || "No description provided."}
        </p>

        <div className="flex flex-wrap gap-2">
          <Tag tone="blue" icon={<GitBranch className="text-blue-600" />} text={repo.defaultBranch || "main"} />
          <Tag
            tone={repo.isPrivate ? "amber" : "emerald"}
            icon={<Lock className={repo.isPrivate ? "text-amber-600" : "text-emerald-600"} />}
            text={repo.isPrivate ? "Private" : "Public"}
          />
          {repo.language && (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-medium text-violet-700 dark:text-violet-300">
              <LanguageBadge language={repo.language} showLabel={false} />
              <span className="truncate">{repo.language}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Metric tone="blue" icon={<CircleDashed className="text-blue-600" />} value={repo.filesTotal.toLocaleString()} label="Files" />
          <Metric tone="violet" icon={<Boxes className="text-violet-600" />} value={repo.chunkCount.toLocaleString()} label="Chunks" />
          <Metric tone="emerald" icon={<Check className="text-emerald-600" />} value={repo.filesProcessed.toLocaleString()} label="Indexed" />
        </div>

        {indexing && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium">Indexing repository</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
        {failed && <IndexErrorAlert message={repo.errorMessage} />}

        <div className="mt-auto flex gap-2 border-t pt-4">
          <Button
            onClick={handleAction}
            disabled={indexing || mutation.isPending}
            className={cn(
              "min-w-0 flex-1 cursor-pointer border-0 !text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md [&_svg]:!text-white",
              ready
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                : failed
                  ? "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700",
            )}
            style={{
              backgroundColor: ready ? "#4f46e5" : failed ? "#e11d48" : "#0891b2",
              color: "#ffffff",
            }}
          >
            {ready ? <MessageSquare className="text-white" /> : failed ? <RotateCcw className="text-white" /> : <Sparkles className="text-white" />}
            <span className="truncate">
              {mutation.isPending ? "Starting..." : ready ? "Open chat" : failed ? "Retry index" : "Index repository"}
            </span>
          </Button>
          {repo.htmlUrl && (
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer border-blue-500/30 !text-blue-600 hover:bg-blue-500/10 hover:!text-blue-700 [&_svg]:!text-blue-600"
              nativeButton={false}
              render={<a href={repo.htmlUrl} target="_blank" rel="noreferrer" aria-label={`Open ${repo.fullName} on GitHub`} />}
            >
              <GithubIcon className="size-5 !text-blue-600" />
            </Button>
          )}
          {ready && (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer !text-violet-600 hover:bg-violet-500/10 hover:!text-violet-700 [&_svg]:text-violet-600"
              onClick={() => router.push(`/chat/${repo.id}`)}
              aria-label={`Open ${repo.fullName}`}
            >
              <ArrowUpRight />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function Tag({
  icon,
  text,
  tone,
}: {
  icon?: ReactNode;
  text: string;
  tone: "blue" | "violet" | "amber" | "emerald";
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full cursor-default items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium",
        tone === "blue" && "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        tone === "violet" && "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        tone === "amber" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        tone === "emerald" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      )}
    >
      {icon && <span className="[&_svg]:size-3.5">{icon}</span>}
      <span className="truncate">{text}</span>
    </span>
  );
}

function Metric({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  tone: "blue" | "violet" | "emerald";
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border bg-muted/20 px-2.5 py-2">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg [&_svg]:size-3.5",
          tone === "blue" && "bg-blue-500/15 text-blue-600",
          tone === "violet" && "bg-violet-500/15 text-violet-600",
          tone === "emerald" && "bg-emerald-500/15 text-emerald-600",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold">{value}</span>
        <span className="block truncate text-[10px] text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

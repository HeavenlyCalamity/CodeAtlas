"use client";

import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { IndexStatus } from "@/lib/api";

type FilterStatus = "ALL" | IndexStatus;
type Visibility = "all" | "public" | "private";

export function DashboardHeader(props: {
  search: string;
  onSearchChange: (value: string) => void;
  visibility: Visibility;
  onVisibilityChange: (value: Visibility) => void;
  status: FilterStatus;
  onStatusChange: (value: FilterStatus) => void;
  totalCount: number;
  readyCount: number;
  onSync: () => void;
  isSyncing: boolean;
}) {
  return (
    <header className="border-b bg-background px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <span className="text-lg font-semibold">{props.totalCount}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-tight">Repositories</h2>
                <Badge variant="secondary" className="hidden rounded-full px-2 sm:inline-flex">
                  {props.readyCount} ready
                </Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                Connected GitHub projects
              </p>
            </div>
          </div>
          <Button
            onClick={props.onSync}
            disabled={props.isSyncing}
            size="sm"
            className="shrink-0 gap-2"
          >
            <RefreshCw className={props.isSyncing ? "animate-spin" : undefined} />
            <span className="hidden sm:inline">{props.isSyncing ? "Syncing..." : "Sync GitHub"}</span>
            <span className="sm:hidden">{props.isSyncing ? "Syncing" : "Sync"}</span>
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={props.search}
              onChange={(event) => props.onSearchChange(event.target.value)}
              placeholder="Search by repository, owner, or language"
              className="h-10 cursor-text bg-muted/40 pl-12 shadow-none focus-visible:ring-1"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1.5 px-2 text-xs text-muted-foreground lg:flex">
              <SlidersHorizontal className="size-3.5" />
              Filter
            </span>
            <FilterGroup
              label="Status"
              value={props.status}
              options={[
                ["ALL", "All"],
                ["READY", "Ready"],
                ["INDEXING", "Indexing"],
                ["PENDING", "Pending"],
                ["FAILED", "Failed"],
              ]}
              onChange={props.onStatusChange}
            />
            <FilterGroup
              label="Visibility"
              value={props.visibility}
              options={[
                ["all", "All"],
                ["public", "Public"],
                ["private", "Private"],
              ]}
              onChange={props.onVisibilityChange}
            />
          </div>
        </div>

      </div>
    </header>
  );
}

function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex h-10 items-center rounded-lg border bg-muted/40 p-1">
      <span className="select-none px-2 text-[11px] font-medium text-muted-foreground">{label}</span>
      {options.map(([optionValue, optionLabel]) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          className={`h-8 cursor-pointer select-none caret-transparent rounded-md px-2.5 text-xs font-medium transition-colors ${
            value === optionValue
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={value === optionValue}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  );
}

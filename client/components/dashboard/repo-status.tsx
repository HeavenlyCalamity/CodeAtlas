import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IndexStatus } from "@/lib/api";

const statusConfig: Record<IndexStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  INDEXING: { label: "Indexing", className: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  READY: { label: "Ready", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  FAILED: { label: "Failed", className: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
};

export function IndexStatusBadge({ status }: { status: IndexStatus }) {
  const config = statusConfig[status] ?? statusConfig.PENDING;
  return (
    <Badge variant="outline" className={cn("select-none caret-transparent gap-1.5", config.className)}>
      {status === "INDEXING" && <LoaderCircle className="size-3 animate-spin text-blue-600" />}
      {status === "READY" && <CheckCircle2 className="size-3 text-emerald-600" />}
      {status === "FAILED" && <CircleAlert className="size-3 text-rose-600" />}
      {config.label}
    </Badge>
  );
}

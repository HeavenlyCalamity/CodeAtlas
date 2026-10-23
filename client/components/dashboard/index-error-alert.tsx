import { AlertTriangle } from "lucide-react";

export function IndexErrorAlert({ message }: { message: string | null }) {
  return <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" /><span>{message || "Indexing failed. Try again."}</span></div>;
}

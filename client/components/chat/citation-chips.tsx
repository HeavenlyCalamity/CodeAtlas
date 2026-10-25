import { useState } from "react";
import { ChevronDown, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Citation, Repository } from "@/lib/api";
import { citationGithubUrl, citationLabel } from "@/lib/chat-sources";

export function CitationChips({
  citations,
  repo,
}: {
  citations: Citation[];
  repo?: Pick<Repository, "htmlUrl" | "defaultBranch">;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = citations.filter((citation) => citation.filePath);
  if (!visible.length) return null;

  return (
    <div className="flex max-w-full flex-col items-start gap-1.5">
      <Button
        type="button"
        size="xs"
        variant="ghost"
        className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <FileCode2 className="size-3.5" />
        {visible.length} {visible.length === 1 ? "source" : "sources"}
        <ChevronDown className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </Button>
      {expanded && <ul className="flex max-w-full flex-col gap-1.5">
      {visible.map((citation, index) => {
        const href = repo ? citationGithubUrl(repo, citation) : null;
        const label = citationLabel(citation);
        return (
          <li
            key={`${citation.filePath}-${citation.startLine ?? "x"}-${index}`}
            className="min-w-0 rounded-lg border bg-muted/40 px-2.5 py-1.5"
          >
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-mono text-[11px] text-foreground underline-offset-2 hover:underline"
              >
                {label}
              </a>
            ) : (
              <span className="block truncate font-mono text-[11px]">{label}</span>
            )}
            {citation.excerpt && (
              <p className="mt-1 line-clamp-2 font-mono text-[11px] leading-4 text-muted-foreground">
                {citation.excerpt}
              </p>
            )}
          </li>
        );
      })}
      </ul>}
    </div>
  );
}

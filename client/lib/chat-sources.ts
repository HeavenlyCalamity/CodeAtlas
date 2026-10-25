import type { Citation, Repository } from "@/lib/api";

export function citationGithubUrl(repo: Pick<Repository, "htmlUrl" | "defaultBranch">, citation: Citation) {
  if (!repo.htmlUrl || !citation.filePath) return null;
  const base = repo.htmlUrl.replace(/\/+$/, "");
  const branch = encodeURIComponent(repo.defaultBranch || "main");
  const path = citation.filePath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  let url = `${base}/blob/${branch}/${path}`;
  if (citation.startLine && citation.startLine > 0) {
    url += `#L${citation.startLine}`;
    if (citation.endLine && citation.endLine > citation.startLine) {
      url += `-L${citation.endLine}`;
    }
  }
  return url;
}

export function citationLabel(citation: Citation) {
  if (citation.startLine && citation.endLine && citation.endLine !== citation.startLine) {
    return `${citation.filePath}:${citation.startLine}–${citation.endLine}`;
  }
  if (citation.startLine) {
    return `${citation.filePath}:${citation.startLine}`;
  }
  return citation.filePath;
}

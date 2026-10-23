import { LanguageIcon } from "@/components/icons/language-icon";
import { Badge } from "@/components/ui/badge";
import type { IconBaseProps, IconType } from "react-icons";
import {
  SiC,
  SiCplusplus,
  SiSharp,
  SiCss,
  SiGo,
  SiHtml5,
  SiJavascript,
  SiKotlin,
  SiPhp,
  SiPython,
  SiRuby,
  SiRust,
  SiSwift,
  SiTypescript,
} from "react-icons/si";

const languageConfig: Record<string, { icon: IconType; color: string }> = {
  c: { icon: SiC, color: "#64748b" },
  "c++": { icon: SiCplusplus, color: "#2563eb" },
  "c#": { icon: SiSharp, color: "#7c3aed" },
  css: { icon: SiCss, color: "#2563eb" },
  go: { icon: SiGo, color: "#06b6d4" },
  html: { icon: SiHtml5, color: "#f97316" },
  javascript: { icon: SiJavascript, color: "#eab308" },
  kotlin: { icon: SiKotlin, color: "#9333ea" },
  php: { icon: SiPhp, color: "#6366f1" },
  python: { icon: SiPython, color: "#2563eb" },
  ruby: { icon: SiRuby, color: "#dc2626" },
  rust: { icon: SiRust, color: "#ea580c" },
  swift: { icon: SiSwift, color: "#f97316" },
  typescript: { icon: SiTypescript, color: "#2563eb" },
  ts: { icon: SiTypescript, color: "#2563eb" },
  js: { icon: SiJavascript, color: "#eab308" },
  "c/c++": { icon: SiCplusplus, color: "#2563eb" },
};

const JavaIcon: IconType = ({ size, color, title, ...props }: IconBaseProps) => (
  <svg
    {...props}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    role={title ? "img" : undefined}
    aria-label={title}
  >
    <path d="M8 9h8v4.5a4 4 0 0 1-8 0V9Z" fill={color ?? "#e11d48"} />
    <path d="M16 10h1.5a2 2 0 0 1 0 4H16" stroke={color ?? "#e11d48"} strokeWidth="1.8" />
    <path d="M10 5c2 1 2 2 0 3M14 4c2 1 2 2 0 3" stroke={color ?? "#e11d48"} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 17h12M5 19h14" stroke={color ?? "#e11d48"} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

languageConfig.java = { icon: JavaIcon, color: "#e11d48" };

export function LanguageBadge({
  language,
  showLabel = true,
  compact = false,
}: {
  language: string | null;
  showLabel?: boolean;
  compact?: boolean;
}) {
  const normalizedLanguage = language?.trim().toLowerCase();
  const config = normalizedLanguage ? languageConfig[normalizedLanguage] : undefined;
  const Icon = config?.icon ?? LanguageIcon;

  const iconColor = config?.color ?? "#6366f1";

  if (!language || !showLabel) {
    return (
      <span
        className={`${compact ? "size-5 rounded-md" : "size-11 rounded-2xl"} flex shrink-0 items-center justify-center bg-background shadow-sm ring-1 ring-border/70 ${languageIconBackground(normalizedLanguage)}`}
        style={{ backgroundColor: `${iconColor}18`, boxShadow: `inset 0 0 0 1px ${iconColor}35` }}
      >
        <Icon className={compact ? "size-3.5" : "size-6"} style={{ color: iconColor }} />
      </span>
    );
  }

  function languageIconBackground(language: string | undefined) {
    switch (language) {
      case "javascript":
      case "js":
        return "bg-yellow-500/10 ring-yellow-500/25";
      case "typescript":
      case "ts":
        return "bg-blue-500/10 ring-blue-500/25";
      case "python":
        return "bg-sky-500/10 ring-sky-500/25";
      case "java":
        return "bg-red-500/10 ring-red-500/25";
      case "go":
        return "bg-cyan-500/10 ring-cyan-500/25";
      case "rust":
        return "bg-orange-500/10 ring-orange-500/25";
      case "kotlin":
        return "bg-purple-500/10 ring-purple-500/25";
      case "swift":
        return "bg-orange-500/10 ring-orange-500/25";
      default:
        return "bg-indigo-500/10 ring-indigo-500/25";
    }
  }

  return (
    <Badge variant="outline" className="gap-1.5 border-primary/20 bg-background/80">
      <Icon className="size-3.5" style={{ color: iconColor }} />
      {language}
    </Badge>
  );
}

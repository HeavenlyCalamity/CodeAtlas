import type { HTMLAttributes } from "react";

export function BrandMark({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={className} aria-label="DevPilot" {...props}>
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="size-8 shrink-0">
        <rect width="32" height="32" rx="10" className="fill-primary" />
        <path
          d="m9 8 7 8-7 8M18 24h5"
          className="stroke-primary-foreground"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-base font-semibold tracking-tight">DevPilot</span>
    </span>
  );
}
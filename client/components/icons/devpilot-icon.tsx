import type { SVGProps } from "react";

export function DevPilotIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="devpilot-icon-gradient" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#devpilot-icon-gradient)" />
      <path
        d="m12.25 10.25-4.5 5.75 4.5 5.75M19.75 10.25l4.5 5.75-4.5 5.75"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m18.25 8.5-4.5 15"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".85"
      />
    </svg>
  );
}
import type { SVGProps } from "react";

export function LanguageIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.25 2.47 3.38 5.47 3.38 9S14.25 18.53 12 21c-2.25-2.47-3.38-5.47-3.38-9S9.75 5.47 12 3Z" />
    </svg>
  );
}
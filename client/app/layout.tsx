import type { Metadata } from "next";
import { Google_Sans, Google_Sans_Code } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import QueryProvider from "@/components/providers/query-provider";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
});

const googleSansCode = Google_Sans_Code({
  variable: "--font-google-sans-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DevPilot | Understand your codebase",
    template: "%s | DevPilot",
  },
  description: "Repository-aware AI assistance for understanding, searching, and navigating your codebase.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${googleSans.variable} ${googleSansCode.variable} h-full antialiased`} suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
      <QueryProvider>
      <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
      </QueryProvider>
      </body>
    </html>
  );
}

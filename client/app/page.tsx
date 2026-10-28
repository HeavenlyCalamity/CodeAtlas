"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GithubIcon } from "@/components/icons/github-icon";
import { LanguageIcon } from "@/components/icons/language-icon";
import { BrandMark } from "@/components/layout/app-shell";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  Code2,
  FileCode,
  GitBranch,
  Layers3,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: GitBranch,
    title: "Connect your repositories",
    description: "Sync the projects you already work on through GitHub OAuth.",
  },
  {
    icon: Layers3,
    title: "Build a living index",
    description: "Turn files and code chunks into a private, searchable repository context.",
  },
  {
    icon: MessageSquare,
    title: "Ask with confidence",
    description: "Explore architecture, trace requests, and investigate bugs in one conversation.",
  },
];

const STATS_CONFIG = [
  { label: "Repositories connected", key: "repos", icon: GitBranch },
  { label: "Files indexed", key: "files", icon: FileCode },
  { label: "AI conversations", key: "conversations", icon: MessageSquare },
  { label: "Languages supported", value: "50+", icon: Layers3 },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [stats, setStats] = useState<Record<string, string>>({
    repos: "--",
    files: "--",
    conversations: "--",
  });

  // Check auth status and fetch workspace stats on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (mounted) setIsLoggedIn(res.ok);

        if (res.ok) {
          const [reposRes] = await Promise.all([
            fetch("/api/repos?refresh=false", { credentials: "include" }),
          ]);
          if (reposRes.ok) {
            const repos = await reposRes.json() as Array<{ filesTotal?: number }>;
            const filesTotal = repos.reduce((sum: number, r) => sum + (r.filesTotal || 0), 0);
            if (mounted) {
              setStats({
                repos: String(repos.length),
                files: String(filesTotal),
                conversations: "--",
              });
            }
          }
        }
      } catch {
        if (mounted) setIsLoggedIn(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.7_0.12_260_/_0.14),transparent_42%)]" />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="DevPilot home" className="flex items-center gap-2">
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-2">
          {!isLoggedIn ? (
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
            >
              <GithubIcon className="size-4" />
              Sign in
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
            >
              <GitBranch className="size-4" />
              Open Dashboard
            </Link>
          )}
          <ModeToggle />
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center sm:pt-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
          <LanguageIcon className="size-4" />
          Built for modern repositories
        </div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-7xl">
          The fastest way to get oriented in an unfamiliar codebase.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          DevPilot connects to GitHub, builds a searchable understanding of your
          repositories, and gives you a focused AI workspace for asking better
          engineering questions.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className={cn(
              buttonVariants({ size: "lg" }),
              "gap-2 w-full sm:w-auto"
            )}
          >
            <GithubIcon className="size-5" />
            {isLoggedIn ? "Open Dashboard" : "Continue with GitHub"}
          </Link>
          <Link
            href="#features"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Explore features
          </Link>
        </div>

        {/* Dynamic stats bar - shows live data when logged in */}
        {isLoggedIn && (
          <div className="mt-12 w-full max-w-3xl">
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Live workspace stats</h3>
                <span className="text-xs text-muted-foreground animate-pulse">● Live</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATS_CONFIG.map((stat) => {
                  const value = stat.key ? stats[stat.key] : stat.value;
                  return (
                    <div
                      key={stat.label}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <stat.icon className="size-5 text-primary" />
                      <span className="text-sm font-medium">{value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
        {/* Workspace stats */}
      {isLoggedIn && (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS_CONFIG.map((stat) => {
              const value = stat.key ? stats[stat.key] : stat.value;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border bg-card/80 p-4 sm:p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <stat.icon className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-mono font-semibold text-foreground">
                        {value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {FEATURES.map((feature, idx) => (
          <article
            key={feature.title}
            className={cn(
              "group relative rounded-3xl border border-border/70 bg-card/70 p-8 shadow-sm hover:border-primary/50 transition-all duration-300",
              hoveredFeature === idx && "ring-1 ring-primary bg-primary/5",
            )}
            onMouseEnter={() => setHoveredFeature(idx)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div className="mb-6 size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <feature.icon className="size-6" />
            </div>
            <h2 className="font-medium">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {feature.description}
            </p>
            <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowRight className="size-3.5" /> Learn more
            </div>
          </article>
        ))}
      </section>

      {/* Use cases */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border bg-card/70 p-6 sm:p-10">
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <p className="text-sm font-medium text-primary">A calmer developer workflow</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                From &ldquo;where is this?&rdquo; to &ldquo;I understand it.&rdquo;
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                DevPilot is designed for the first hour in a new repository, the
                difficult bug in an old one, and every question between them.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  ["Star", "4.9/5"],
                  ["Users", "10k+"],
                  ["Repos", "50k+"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">{label}:</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { Icon: Search, label: "Find the right files" },
                { Icon: Code2, label: "Read code in context" },
                { Icon: BookOpen, label: "Learn the architecture" },
                { Icon: ShieldCheck, label: "Keep access scoped" },
              ].map(({ Icon: IconComponent, label }, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border bg-background/70 p-4 group hover:bg-primary/5 transition-colors"
                >
                  <IconComponent className="size-4 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> DevPilot · Repository
            intelligence for developers
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/HeavenlyCalamity/RepoScanner"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              Source on GitHub{" "}
              <ArrowRight className="ml-1 inline size-3" />
            </Link>
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="hover:text-foreground">
              {isLoggedIn ? "Dashboard" : "Get started"}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

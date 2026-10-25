import Link from "next/link";

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
  GitBranch,
  Layers3,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.7_0.12_260_/_0.14),transparent_42%)]" />
      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="DevPilot home">
          <BrandMark className="flex items-center gap-2" />
        </Link>
        <nav className="flex items-center gap-2">
           <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
            <GithubIcon className="size-4" />
             Sign in
          </Link>
          <ModeToggle />
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center sm:pt-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
          <LanguageIcon className="size-4" />
          Built for modern repositories
        </div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-7xl">
          The fastest way to get oriented in an unfamiliar codebase.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          DevPilot connects to GitHub, builds a searchable understanding of your repositories, and gives you a focused AI workspace for asking better engineering questions.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
            <GithubIcon className="size-5" />
            Continue with GitHub
          </Link>
          <Link href="#features" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Explore features
          </Link>
        </div>
        <div className="mt-12 grid w-full max-w-3xl grid-cols-3 gap-3 text-left">
          {[
            ["Repository-aware", "Answers grounded in your indexed files"],
            ["Traceable", "Jump from an answer to its source"],
            ["Built for teams", "Keep exploration tied to real projects"],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border bg-card/60 p-4 backdrop-blur">
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
        {[
          [GitBranch, "Connect your repositories", "Sync the projects you already work on through GitHub OAuth."],
          [Layers3, "Build a living index", "Turn files and code chunks into a private, searchable repository context."],
          [MessageSquare, "Ask with confidence", "Explore architecture, trace requests, and investigate bugs in one conversation."],
        ].map(([Icon, title, description]) => (
          <article key={title as string} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm">
            <Icon className="mb-8 size-5 text-primary" />
            <h2 className="font-medium">{title as string}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description as string}</p>
          </article>
        ))}
      </section>
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border bg-card/70 p-6 sm:p-10">
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <p className="text-sm font-medium text-primary">A calmer developer workflow</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">From “where is this?” to “I understand it.”</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">DevPilot is designed for the first hour in a new repository, the difficult bug in an old one, and every question between them.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [Search, "Find the right files"],
                [Code2, "Read code in context"],
                [BookOpen, "Learn the architecture"],
                [ShieldCheck, "Keep access scoped"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-3 rounded-xl border bg-background/70 p-4">
                  <Icon className="size-4 text-primary" />
                  <span className="text-sm font-medium">{label as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <footer className="relative z-10 border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> DevPilot · Repository intelligence for developers</div>
          <div className="flex items-center gap-4">
            <Link href="https://github.com/HeavenlyCalamity/RepoScanner" target="_blank" rel="noreferrer" className="hover:text-foreground">Source on GitHub <ArrowRight className="ml-1 inline size-3" /></Link>
            <Link href="/login" className="hover:text-foreground">Get started</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
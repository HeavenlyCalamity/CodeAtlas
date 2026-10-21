import Link from "next/link";

import { GithubIcon } from "@/components/icons/github-icon";
import { LanguageIcon } from "@/components/icons/language-icon";
import { BrandMark } from "@/components/layout/app-shell";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.7_0.12_260_/_0.14),transparent_42%)]" />
      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="DevPilot home">
          <BrandMark className="flex items-center gap-2" />
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="https://github.com" target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
            <GithubIcon className="size-4" />
            GitHub
          </Link>
          <ModeToggle />
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-24 text-center sm:pt-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
          <LanguageIcon className="size-4" />
          Built for modern repositories
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Understand your codebase with confidence.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          DevPilot indexes your repositories and helps you navigate, search, and reason about the code that powers your projects.
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
      </section>

      <section id="features" className="relative z-10 mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
        {[
          ["Repository context", "Keep the structure and relationships of your project in view."],
          ["Focused answers", "Find the files and symbols that matter without losing the bigger picture."],
          ["Developer workflow", "Move from question to implementation with less context switching."],
        ].map(([title, description]) => (
          <article key={title} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm">
            <h2 className="font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
"use client";

import Link from "next/link";
import {
  ExternalLink,
  GitBranch,
  Link2,
  Loader2,
  LogOut,
  Palette,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { BrandMark } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { useLogout, useCurrentUser } from "@/hooks/use-auth";
import { useImportRepo } from "@/hooks/use-repo";

export function SettingsDashboard() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const importRepo = useImportRepo();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [enterToSend, setEnterToSend] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [restoreHistory, setRestoreHistory] = useState(true);

  useEffect(() => {
      // Defer state updates to avoid synchronous setState in effect
      setTimeout(() => {
        setEnterToSend(localStorage.getItem("devpilot:enter-to-send") !== "false");
        setCompactMode(localStorage.getItem("devpilot:compact-mode") === "true");
        setRestoreHistory(localStorage.getItem("devpilot:restore-history") !== "false");
      }, 0);
    }, []);

  const savePreference = (key: string, value: boolean, setter: (value: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = repositoryUrl.trim();
    if (!url) return;
    importRepo.mutate(url, {
      onSuccess: () => setRepositoryUrl(""),
    });
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-8">
      <header>
        <p className="text-sm font-medium text-primary">Workspace preferences</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Personalize DevPilot and manage the repositories available in your workspace.
        </p>
      </header>

      <Card>
        <CardHeader className="flex items-center justify-between border-b">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </span>
            <div>
              <CardTitle>Your profile</CardTitle>
              <CardDescription className="mt-1">
                View and manage the GitHub account connected to your DevPilot workspace.
              </CardDescription>
            </div>
          </div>
          <Link href="/dashboard/profile">
            <Button>Go to profile</Button>
          </Link>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GitBranch className="size-5" />
            </span>
            <div>
              <CardTitle>Import a GitHub repository</CardTitle>
              <CardDescription className="mt-1">
                Add a repository by URL, including repositories you collaborate on.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleImport} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                placeholder="https://github.com/owner/repository"
                aria-label="GitHub repository URL"
                className="h-11 rounded-2xl pl-10"
                disabled={importRepo.isPending}
              />
            </div>
            <Button type="submit" size="lg" className="h-11 rounded-2xl" disabled={!repositoryUrl.trim() || importRepo.isPending}>
              {importRepo.isPending ? <Loader2 className="animate-spin" /> : <GitBranch />}
              {importRepo.isPending ? "Adding..." : "Add repository"}
            </Button>
          </form>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            DevPilot checks the URL through your GitHub connection and adds it to your account. You can index it from the repository workspace afterward.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-10 rounded-2xl" /> : <BrandMark />}
            </span>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription className="mt-1">Your DevPilot identity and connection.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-12 rounded-2xl" /> : <BrandMark />}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{user?.displayName ?? "Signed in user"}</p>
            <p className="truncate text-sm text-muted-foreground">@{user?.githubUsername ?? "github-user"}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/profile" />}
          >
            <UserRound data-icon="inline-start" /> View profile
          </Button>
          <Button variant="outline" size="sm" disabled={logout.isPending} onClick={() => logout.mutate()}>
            <LogOut data-icon="inline-start" /> Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Settings2 className="size-5" />
            </span>
            <div>
              <CardTitle>Chat preferences</CardTitle>
              <CardDescription className="mt-1">Control how the chat workspace behaves on this device.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="divide-y">
          <PreferenceRow label="Enter to send" description="Press Enter to submit; use Shift+Enter for a new line." checked={enterToSend} onChange={(value) => savePreference("devpilot:enter-to-send", value, setEnterToSend)} />
          <PreferenceRow label="Restore last conversation" description="Open the most recent conversation when returning to a repository." checked={restoreHistory} onChange={(value) => savePreference("devpilot:restore-history", value, setRestoreHistory)} />
          <PreferenceRow label="Compact message spacing" description="Use a denser timeline for longer technical conversations." checked={compactMode} onChange={(value) => savePreference("devpilot:compact-mode", value, setCompactMode)} />
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Palette className="mt-0.5 size-5 text-primary" />
              <div><CardTitle>Appearance</CardTitle><CardDescription className="mt-1">Choose how DevPilot looks on this device.</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div><p className="font-medium">Theme</p><p className="text-sm text-muted-foreground">Light, dark, or system.</p></div>
            <ModeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-primary" />
              <div><CardTitle>GitHub connection</CardTitle><CardDescription className="mt-1">Repository access is managed through GitHub OAuth.</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="h-auto px-0" nativeButton={false} render={<Link href="https://github.com/settings/applications" target="_blank" rel="noreferrer" />}>
              Manage connected applications <ExternalLink data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function PreferenceRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-primary" />
    </label>
  );
}

"use client";

import { useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  Clock,
  FileCode,
  Globe,
  GitBranch,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useGithubProfile } from "@/hooks/use-github-profile";
import { getGithubLoginUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { GithubProfile, GithubRepoSummary } from "@/lib/api";

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f7df1e",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Cpp: "#00599C",
  C: "#555555",
  CSharp: "#68217A",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#FFAC45",
  Kotlin: "#F18E33",
  Dart: "#00B4AB",
  Scala: "#DC322F",
  Haskell: "#5E5086",
  Lua: "#000080",
  Perl: "#0298c3",
  R: "#198CE7",
  Shell: "#89e051",
  SQL: "#e38c00",
  HTML: "#e34c26",
  CSS: "#264de4",
};

function getLanguageColor(language: string | null | undefined) {
  if (!language) return "#94a3b8";
  return LANGUAGE_COLORS[language] ?? "#94a3b8";
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return "—";
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function initialsOf(name: string | null | undefined) {
  if (!name) return "U";
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                         */
/* ------------------------------------------------------------------ */
function StatCard({
  icon,
  label,
  value,
  trend,
  accent = "text-primary",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  accent?: string;
}) {
  return (
    <Card className="p-5 group hover:border-primary/50 transition-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums {accent}">{value}</p>
          {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className="size-11 shrink-0 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile field                                                     */
/* ------------------------------------------------------------------ */
function ProfileField({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="group relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-0.5 bg-primary group-hover:w-1 transition-all" />
      <div className="flex items-start gap-3 py-3 px-4 rounded-xl border border-transparent group-hover:border-primary/30 group-hover:bg-muted/50 transition-all cursor-default">
        <div className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="mt-1 flex items-baseline gap-2">
            {href ? (
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm font-medium text-primary hover:underline"
              >
                {value}
              </Link>
            ) : (
              <p className="truncate text-sm font-medium">{value}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail row                                                        */
/* ------------------------------------------------------------------ */
function ProfileDetail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:size-4">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 truncate font-medium">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Repo row                                                          */
/* ------------------------------------------------------------------ */
function RepoRow({ repo }: { repo: GithubRepoSummary }) {
  const stars = repo.stargazersCount ?? 0;
  const forks = repo.forksCount ?? 0;
  const issues = repo.openIssuesCount ?? 0;
  return (
    <div className="group flex items-center gap-3 px-5 py-4 border-b last:border-0 hover:bg-accent transition-colors cursor-default">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
        <FileCode className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm font-medium text-primary hover:underline"
        >
          {repo.name}
        </Link>
        {repo.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{repo.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          {repo.language && <Badge variant="outline" className="shrink-0">{repo.language}</Badge>}
          <span className="flex items-center gap-1 text-muted-foreground">
            <Star className="size-3.5" /> {stars.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <svg className="size-3.5" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M2 2.5A.25.25 0 0 1 2.25 2H14a.25.25 0 0 1 .143.353l-2 5A.25.25 0 0 1 11.75 9H7.25l-2-5A.25.25 0 0 1 5.25 2H2z" clipRule="evenodd" />
            </svg>{forks.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground ml-auto">
            <svg className="size-3.5" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a1.5 1.5 0 0 0-1 1.318V7h2V4.818A1.5 1.5 0 0 0 9 3.5zM8 1a.5.5 0 0 1 .5.5V2h3.5A.5.5 0 0 1 12 2v3.5a.5.5 0 0 1-1 0V3H7v2.5a.5.5 0 0 1-1 0V2H5V1.5A.5.5 0 0 1 5.5 1zM5.5 10a.5.5 0 0 1 .5.5h3a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5z" clipRule="evenodd" />
            </svg>{issues.toLocaleString()}
          </span>
          <Badge variant={repo.isPrivate ? "destructive" : "secondary"} className="shrink-0">{repo.isPrivate ? "Private" : "Public"}</Badge>
          <span className="text-muted-foreground">{timeAgo(repo.updatedAt)}</span>
        </div>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stars bar chart                                                   */
/* ------------------------------------------------------------------ */
function RepoStarsChart({ repos }: { repos: GithubRepoSummary[] }) {
  const data = repos
    .slice()
    .sort((a, b) => (b.stargazersCount ?? 0) - (a.stargazersCount ?? 0))
    .slice(0, 6)
    .map((repo) => ({
      name: repo.name.length > 18 ? `${repo.name.slice(0, 18)}…` : repo.name,
      stars: repo.stargazersCount ?? 0,
    }));

  const hasData = data.some((item) => item.stars > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stars by repository</CardTitle>
        <CardDescription>Star count across your most recently updated repositories.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[260px] w-full">
          {!hasData ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No star data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barSize="24">
                <CartesianGrid vertical={false} className="text-[rgba(0,0,0,0.03)]" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="stars" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Language breakdown pie chart                                      */
/* ------------------------------------------------------------------ */
function LanguageBreakdownChart({ repos }: { repos: GithubRepoSummary[] }) {
  const languageCounts: Record<string, number> = {};
  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] ?? 0) + 1;
    }
  });

  const data = Object.entries(languageCounts).map(([name, count]) => ({
    name,
    value: count,
    color: getLanguageColor(name),
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
          <CardDescription>No language data available yet.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No repositories with language data.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Languages used</CardTitle>
        <CardDescription>Breakdown across your recent repositories.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid items-center gap-4 md:grid-cols-2">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {data.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{entry.name}</span>
                <span className="ml-auto text-muted-foreground">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity feed (simulated from repo data)                          */
/* ------------------------------------------------------------------ */
function ActivityFeed({ repos }: { repos: GithubRepoSummary[] }) {
  const activities = repos
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
    )
    .slice(0, 6)
    .map((repo) => ({
      action: repo.description ? "Updated" : "Pushed",
      repo: repo.name,
      time: timeAgo(repo.updatedAt),
      isPrivate: repo.isPrivate,
    }));

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Your latest GitHub activity will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No recent activity.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Your latest repository updates.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {activities.map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 px-5 py-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                <GitBranch className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {activity.action} <span className="text-primary">{activity.repo}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              <Badge variant={activity.isPrivate ? "destructive" : "secondary"} className="shrink-0">
                {activity.isPrivate ? "Private" : "Public"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton loading state                                            */
/* ------------------------------------------------------------------ */
function ProfileSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 py-8 md:px-8">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="mt-5 h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-24" />
      </div>
      <CardContent className="grid gap-4 p-6 md:grid-cols-4 md:p-8">
        {[1, 2, 3, 4].map((i) => (
          <StatCard key={i} icon={<Skeleton className="h-5 w-5" />} label="—" value="—" />
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  GitHub error banner                                               */
/* ------------------------------------------------------------------ */
function GithubErrorBanner({
  error,
  onRefresh,
  onReconnect,
}: {
  error: unknown;
  onRefresh: () => void;
  onReconnect: () => void;
}) {
  const isAuthError = error instanceof Error && error.message.includes("401");

  return (
    <Card className="border-destructive/50">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-5" />
          </span>
          <div>
            <CardTitle>GitHub profile unavailable</CardTitle>
            <CardDescription className="mt-1">
              {isAuthError
                ? "Your GitHub access token is invalid or expired. Reconnect to load your GitHub stats and repositories."
                : error instanceof Error
                ? error.message
                : "Unexpected error loading GitHub data."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {isAuthError ? (
          <Button onClick={onReconnect} className="w-full" variant="default">
            <LogOut className="size-4 mr-2" /> Reconnect GitHub
          </Button>
        ) : (
          <Button onClick={onRefresh} className="w-full">
            <RefreshCw className="size-4 mr-2" /> Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export function ProfileDashboard() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const logout = useLogout();
  const {
    data: github,
    isLoading: githubLoading,
    isError: githubError,
    error: githubErrorData,
    refetch: refreshGithub,
  } = useGithubProfile();

  const handleRefresh = useCallback(() => {
    void refreshGithub();
  }, [refreshGithub]);

  const handleReconnect = useCallback(() => {
    window.location.href = getGithubLoginUrl();
  }, []);

  const displayName = github?.name ?? user?.displayName ?? "Signed in user";
  const login = github?.login ?? user?.githubUsername ?? "github-user";
  const avatarUrl = github?.avatarUrl ?? user?.avatarUrl ?? null;
  const bio = github?.bio ?? null;
  const company = github?.company ?? null;
  const location = github?.location ?? null;
  const blog = github?.blog ?? null;
  const email = github?.email ?? null;
  const twitter = github?.twitterUsername ?? null;
  const publicRepos = github?.publicRepos ?? 0;
  const followers = github?.followers ?? 0;
  const following = github?.following ?? 0;
  const createdAt = github?.createdAt ?? null;
  const updatedAt = github?.updatedAt ?? null;
  const htmlUrl = github?.htmlUrl ?? null;
  const recentRepos = github?.recentRepos ?? [];
  const totalStars = recentRepos.reduce((sum, r) => sum + (r.stargazersCount ?? 0), 0);
  const totalForks = recentRepos.reduce((sum, r) => sum + (r.forksCount ?? 0), 0);

  const filledFields = [bio, company, location, blog, email, twitter, github?.name].filter(Boolean).length;
  const profileCompletion = Math.round((filledFields / 7) * 100);

  const isInitialLoading = userLoading && !user && !github;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Account</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Your profile</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          View the GitHub identity connected to your DevPilot workspace.
        </p>
      </header>

      {isInitialLoading && <ProfileSkeleton />}

      {(!isInitialLoading || user || github) && (
        <>
          {/* Hero */}
          <Card className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent -z-10" />
            <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 py-8 md:px-10 md:py-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-[80px] -z-10 animate-pulse" />
                    <Avatar size="lg" className="size-28 ring-4 ring-background shrink-0 z-10 shadow-lg">
                      <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                      <AvatarFallback className="text-3xl">{initialsOf(displayName)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h3 className="mt-0 md:mt-2 text-3xl font-bold tracking-tight">{displayName}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">@{login}</p>
                  </div>
                </div>
                {htmlUrl && (
                  <Link href={htmlUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline md:ml-4">
                    <ArrowUpRight className="size-4" /> View on GitHub
                  </Link>
                )}
              </div>
              {bio && <p className="mt-5 text-sm leading-relaxed text-muted-foreground italic">&ldquo;{bio}&rdquo;</p>}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {company && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-4" /> {company}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" /> {location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" /> Joined {formatDate(createdAt)}
                </span>
                {updatedAt && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RefreshCw className="size-3.5" /> Refreshed {timeAgo(updatedAt)}
                  </span>
                )}
              </div>
            </div>

            <Separator className="my-0" />
            <CardContent className="grid gap-3 p-6 md:grid-cols-4 md:p-10">
              <StatCard icon={<GitBranch className="text-primary" />} label="Public repositories" value={publicRepos.toLocaleString()} />
              <StatCard icon={<Star className="text-yellow-500" />} label="Stars (recent repos)" value={totalStars.toLocaleString()} trend={recentRepos.length ? `across ${recentRepos.length} repos` : "—"} />
              <StatCard icon={<Star className="text-gray-400" />} label="Forks (recent repos)" value={totalForks.toLocaleString()} />
              <StatCard icon={<UserRound className="text-primary" />} label="Followers" value={followers.toLocaleString()} />
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-fit">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="repositories">Recent repositories</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                  <CardDescription>Public details from your GitHub profile.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-0">
                  <div className="space-y-0">
                    {bio && (
                      <ProfileField icon={<FileCode className="size-4" />} label="Bio" value={bio} />
                    )}
                    {company && (
                      <ProfileField icon={<Building2 className="size-4" />} label="Company" value={company} />
                    )}
                    {location && (
                      <ProfileField icon={<MapPin className="size-4" />} label="Location" value={location} />
                    )}
                    {blog && (
                      <ProfileField
                        icon={<Globe className="size-4" />}
                        label="Website"
                        value={blog}
                        href={blog.startsWith("http") ? blog : `https://${blog}`}
                      />
                    )}
                    {email && (
                      <ProfileField icon={<Mail className="size-4" />} label="Email" value={email} href={`mailto:${email}`} />
                    )}
                    {twitter && (
                      <ProfileField icon={<UserRound className="size-4" />} label="Twitter / X" value={twitter} href={`https://x.com/${twitter}`} />
                    )}
                    {!bio && !company && !location && !blog && !email && !twitter && (
                      <div className="flex items-center gap-3 py-4 px-6 rounded-xl border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
                        <FileCode className="size-4 opacity-50" />
                        <span>No public profile details available.</span>
                      </div>
                    )}
                  </div>
                  <Separator className="my-6" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-muted-foreground">Profile completeness</p>
                        <span className="text-xs font-medium text-primary">{profileCompletion}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, profileCompletion))}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Your DevPilot account and connected GitHub identity.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 p-6 md:grid-cols-2 md:p-8">
                  <ProfileDetail icon={<UserRound />} label="Display name" value={user?.displayName ?? "Not available"} />
                  <ProfileDetail icon={<GitBranch />} label="GitHub username" value={`@${user?.githubUsername ?? "Not available"}`} />
                  <ProfileDetail icon={<Calendar />} label="GitHub profile updated" value={timeAgo(updatedAt)} />
                  <ProfileDetail icon={<ShieldCheck />} label="Authentication" value="GitHub OAuth" />
                </CardContent>
              </Card>

              {/* Charts row */}
              <div className="grid gap-4 md:grid-cols-2">
                <RepoStarsChart repos={recentRepos} />
                <LanguageBreakdownChart repos={recentRepos} />
              </div>

              {/* Activity */}
              <ActivityFeed repos={recentRepos} />
            </TabsContent>

            <TabsContent value="repositories" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardTitle>Recent repositories</CardTitle>
                    <CardDescription>Your most recently updated public and private repositories on GitHub.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={githubLoading}
                    className="shrink-0"
                  >
                    <RefreshCw className={githubLoading ? "animate-spin size-4" : "size-4 mr-2"} />
                    {githubLoading ? "Refreshing" : "Refresh"}
                  </Button>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {githubError && recentRepos.length === 0 ? (
                      <GithubErrorBanner error={githubErrorData} onRefresh={handleRefresh} onReconnect={handleReconnect} />
                    ) : recentRepos.length ? (
                      recentRepos.map((repo) => <RepoRow key={repo.fullName || repo.name} repo={repo} />)
                    ) : (
                      <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                        <GitBranch className="mb-3 size-6 opacity-40 mx-auto" />
                        <p>No repositories found.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {githubError && recentRepos.length === 0 && (
            <GithubErrorBanner error={githubErrorData} onRefresh={handleRefresh} onReconnect={handleReconnect} />
          )}

          {/* Connected account */}
          <Card className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent -z-10" />
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <CardTitle>Connected account</CardTitle>
                  <CardDescription className="mt-1">DevPilot uses your GitHub connection to access repositories you can work with.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex items-center gap-3 pt-6">
              <BrandMark />
              <p className="flex-1 text-sm text-muted-foreground">Signed in with GitHub OAuth</p>
              <Button variant="outline" disabled={logout.isPending} onClick={() => logout.mutate()}>
                <LogOut data-icon="inline-start" />
                {logout.isPending ? "Signing out..." : "Sign out"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}

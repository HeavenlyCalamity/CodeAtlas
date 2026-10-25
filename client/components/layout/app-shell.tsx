"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, UserRound } from "lucide-react";

import { DevPilotIcon } from "@/components/icons/devpilot-icon";
import { useLogout, useCurrentUser } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { dashboardNavGroups, isDashboardNavActive } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

type AppShellProps = {
    children: React.ReactNode;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    hideHeader?: boolean;
    contentClassName?: string;
    className?: string;
};

export function AppShell({
    children,
    title,
    description,
    actions,
    hideHeader = false,
    contentClassName,
    className,
}: AppShellProps) {
    const pathname = usePathname();
    const { data: user } = useCurrentUser();
    const logout = useLogout();
    const initials =
        user?.displayName
            ?.split(" ")
            .map((name) => name[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() ?? "U";

    return (
        <SidebarProvider className={className}>
            <Sidebar variant="inset" collapsible="icon">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                tooltip="DevPilot"
                                render={<Link href="/dashboard" />}
                            >
                                <DevPilotIcon className="size-8 rounded-[10px]" />
                                <span className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">DevPilot</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        Chat with your code
                                    </span>
                                </span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    {dashboardNavGroups.map((group) => (
                        <SidebarGroup key={group.label}>
                            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {group.items.map((item) => {
                                        const active = isDashboardNavActive(
                                            pathname,
                                            item.href,
                                            item.exact,
                                        );
                                        const Icon = item.icon;

                                        return (
                                            <SidebarMenuItem key={item.href}>
                                                <SidebarMenuButton
                                                    isActive={active}
                                                    tooltip={item.title}
                                                    render={<Link href={item.href} />}
                                                >
                                                    <Icon />
                                                    <span>{item.title}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </SidebarContent>

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <SidebarMenuButton
                                            size="lg"
                                            tooltip={user?.displayName ?? "Account"}
                                        />
                                    }
                                >
                                    <Avatar size="sm">
                                        <AvatarImage
                                            src={user?.avatarUrl ?? undefined}
                                            alt={user?.displayName ?? "User"}
                                        />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">
                                            {user?.displayName ?? "Account"}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user ? `@${user.githubUsername}` : "Signed in"}
                                        </span>
                                    </span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    side="top"
                                    align="start"
                                    className="min-w-56"
                                >
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>
                                            {user?.displayName ?? "Account"}
                                        </DropdownMenuLabel>
                                    <DropdownMenuItem
                                        render={<Link href="/dashboard/profile" />}
                                    >
                                        <UserRound />
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        render={<Link href="/dashboard/settings" />}
                                    >
                                        <Settings />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        disabled={logout.isPending}
                                        onClick={() => logout.mutate()}
                                    >
                                        <LogOut />
                                        {logout.isPending ? "Signing out..." : "Sign out"}
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="h-full min-h-0 overflow-hidden">
                {!hideHeader && (
                    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                            <div className="min-w-0">
                                {title && (
                                    <h1 className="truncate text-sm font-medium">{title}</h1>
                                )}
                                {description && (
                                    <p className="truncate text-xs text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {actions}
                                <ModeToggle />
                            </div>
                        </div>
                    </header>
                )}
                <main
                    className={cn(
                        "flex min-h-0 flex-1 flex-col overflow-hidden",
                        contentClassName ?? (!hideHeader && "p-4"),
                    )}
                >
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

export function BrandMark({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
            <DevPilotIcon className="size-8 rounded-[10px]" />
            <span className="font-heading text-[1.05rem] leading-none">DevPilot</span>
        </div>
    );
}

export function GhostButtonLink({
    href,
    children,
    className,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Button variant="ghost" size="sm" className={className} render={<Link href={href} />}>
            {children}
        </Button>
    );
}

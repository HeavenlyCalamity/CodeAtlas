"use client";

import { RequireAuth } from "@/components/providers/require-auth";
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardPage() {
    return (
        <RequireAuth>
            <AppShell title="Repositories" description="Manage your connected repositories">
                <section className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                    <h1 className="text-xl font-semibold">Your repositories</h1>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Connect a GitHub repository to start reviewing and chatting with your code.
                    </p>
                </section>
            </AppShell>
        </RequireAuth>
    );
}
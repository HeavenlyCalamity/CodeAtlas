import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/providers/require-auth";

export default function OverviewPage() {
  return (
    <RequireAuth>
      <AppShell
        title="Overview"
        description="A quick view of your repository workspace"
        contentClassName="p-0"
      >
        <OverviewDashboard />
      </AppShell>
    </RequireAuth>
  );
}

import { SettingsDashboard } from "@/components/dashboard/settings-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/providers/require-auth";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <AppShell
        title="Settings"
        description="Manage your DevPilot workspace"
        contentClassName="p-0"
      >
        <SettingsDashboard />
      </AppShell>
    </RequireAuth>
  );
}

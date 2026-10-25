import { ProfileDashboard } from "@/components/dashboard/profile-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/providers/require-auth";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <AppShell
        title="Profile"
        description="Manage your DevPilot account"
        contentClassName="p-0"
      >
        <ProfileDashboard />
      </AppShell>
    </RequireAuth>
  );
}

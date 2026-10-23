import { Settings2, ShieldCheck } from "lucide-react";

export function SettingsDashboard() {
  return <section className="mx-auto w-full max-w-3xl p-4 md:p-6"><div className="rounded-2xl border bg-card p-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Settings2 /></span><div><h2 className="font-semibold">Workspace settings</h2><p className="text-sm text-muted-foreground">Manage your DevPilot workspace preferences.</p></div></div><div className="mt-6 flex items-start gap-3 rounded-xl border border-dashed p-4 text-sm"><ShieldCheck className="mt-0.5 size-4 text-primary" /><p className="text-muted-foreground">Your GitHub connection and repository permissions are managed securely through OAuth.</p></div></div></section>;
}

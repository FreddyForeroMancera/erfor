import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SettingsModule } from "@/components/settings-module";
import { getSessionUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <SettingsModule />
    </AppShell>
  );
}

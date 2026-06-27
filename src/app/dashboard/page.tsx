import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "CLIENTE_EXTERNO") redirect("/portal");
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { VisitsModule } from "@/components/visits-module";
import { getSessionUser } from "@/lib/auth";

export default async function VisitsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <AppShell>
      <VisitsModule />
    </AppShell>
  );
}

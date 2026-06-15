import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PropertiesModule } from "@/components/properties-module";
import { getSessionUser } from "@/lib/auth";

export default async function PropertiesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <AppShell>
      <PropertiesModule />
    </AppShell>
  );
}

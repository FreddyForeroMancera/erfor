import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { IaAssistantModule } from "@/components/ia-assistant-module";
import { getSessionUser } from "@/lib/auth";

export default async function IaAssistantPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <IaAssistantModule />
    </AppShell>
  );
}

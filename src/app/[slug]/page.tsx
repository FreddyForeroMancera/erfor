import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResourceManager } from "@/components/resource-manager";
import { getModule } from "@/lib/modules";
import { getSessionUser } from "@/lib/auth";

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { slug } = await params;
  const config = getModule(slug);
  return (
    <AppShell>
      <ResourceManager config={config} />
    </AppShell>
  );
}

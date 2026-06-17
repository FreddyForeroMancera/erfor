import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FilesModule } from "@/components/files-module";
import { getSessionUser } from "@/lib/auth";

export default async function FilesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <AppShell>
      <FilesModule />
    </AppShell>
  );
}

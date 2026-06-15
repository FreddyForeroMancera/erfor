import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CalendarModule } from "@/components/calendar-module";
import { getSessionUser } from "@/lib/auth";

export default async function CalendarPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <AppShell>
      <CalendarModule />
    </AppShell>
  );
}

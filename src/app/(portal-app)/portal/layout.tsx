import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { getSessionUser } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/portal/login");
  
  return <PortalShell>{children}</PortalShell>;
}

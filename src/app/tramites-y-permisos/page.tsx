import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProceduresModule } from "@/components/procedures-module";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TramitesYPermisosPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const procedures = await prisma.procedure.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      type: true,
      authority: true,
      status: true,
      filingNumber: true,
      filingDate: true,
      expectedResponseDate: true,
      project: { select: { name: true } },
      client: { select: { name: true } }
    }
  });

  return (
    <AppShell>
      <ProceduresModule initialData={procedures} />
    </AppShell>
  );
}

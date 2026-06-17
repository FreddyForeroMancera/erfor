import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LegalRequirementsModule } from "@/components/legal-requirements-module";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RequisitosLegalesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Fetching data from the database
  const requirements = await prisma.legalRequirement.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      normType: true,
      normNumber: true,
      year: true,
      authority: true,
      category: true,
      status: true,
      verified: true,
    }
  });

  return (
    <AppShell>
      <LegalRequirementsModule initialData={requirements} />
    </AppShell>
  );
}

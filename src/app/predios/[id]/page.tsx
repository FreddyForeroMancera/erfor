import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PropertyDetailModule } from "@/components/property-detail-module";
import { getSessionUser } from "@/lib/auth";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  
  return (
    <AppShell>
      <PropertyDetailModule propertyId={id} />
    </AppShell>
  );
}

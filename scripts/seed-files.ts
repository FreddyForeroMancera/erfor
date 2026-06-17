import { PrismaClient, WorkStatus, Priority, RiskLevel } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const client = await prisma.client.findFirst({ where: { name: 'Finca El Porvenir' } });
  if (!client) return;

  const properties = await prisma.property.findMany({ where: { clientId: client.id } });
  
  // Mapear cada predio a un expediente simulado
  const statuses = [WorkStatus.PREPARATION, WorkStatus.FILED, WorkStatus.APPROVED, WorkStatus.EVALUATION];
  const types = ["Permisivo", "Sancionatorio", "Permisivo", "Permisivo"];
  const codes = ["EXP-2024-156", "EXP-2025-089", "EXP-2023-412", "EXP-2026-001"];

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    // Check if it already has a file (Predio El Porvenir already has one)
    const existing = await prisma.environmentalFile.findFirst({ where: { propertyId: prop.id } });
    
    if (existing) {
      // Update existing to match the requested status if needed
      await prisma.environmentalFile.update({
        where: { id: existing.id },
        data: {
          status: statuses[i % statuses.length],
          type: types[i % types.length],
          officialCode: codes[i % codes.length],
        }
      });
    } else {
      await prisma.environmentalFile.create({
        data: {
          clientId: client.id,
          propertyId: prop.id,
          internalCode: `ERF-${2020+i}-00${i+1}`,
          officialCode: codes[i % codes.length],
          authority: "CAR Cundinamarca",
          type: types[i % types.length],
          status: statuses[i % statuses.length],
          priority: Priority.MEDIUM,
          riskLevel: RiskLevel.MEDIUM,
        }
      });
    }
  }
  console.log("Converted properties to files successfully.");
}

main().then(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  let client = await prisma.client.findFirst();
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: "Cliente de Demostración S.A.",
        type: "Empresa",
        documentNumber: "900.123.456-7",
        status: "ACTIVE",
        priority: "HIGH"
      }
    });
  }

  await prisma.property.createMany({
    data: [
      {
        clientId: client.id,
        name: "Hacienda La Esperanza",
        area: "120 Hectáreas",
        environmentalAuthority: "CAR Cundinamarca",
        city: "Zipaquirá",
        useCurrent: "Agrícola",
        useProposed: "Agroindustrial",
        environmentalRestrictions: "Zona de reserva forestal protectora al norte."
      },
      {
        clientId: client.id,
        name: "Lote Industrial Norte",
        area: "5 Hectáreas",
        environmentalAuthority: "SDA Bogotá",
        city: "Bogotá D.C.",
        useCurrent: "Industrial",
        useProposed: "Industrial",
        environmentalRestrictions: "Nivel freático alto, restricción de vertimientos."
      },
      {
        clientId: client.id,
        name: "Reserva El Paraíso",
        area: "450 Hectáreas",
        environmentalAuthority: "Cortolima",
        city: "Ibagué",
        useCurrent: "Conservación",
        useProposed: "Ecoturismo",
        environmentalRestrictions: "Protección estricta de cuenca hidrográfica."
      }
    ]
  });
  
  console.log("¡3 Predios de demostración creados con éxito!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())

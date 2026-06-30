import { PrismaClient, WorkStatus, Priority, RiskLevel } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany();
  
  if (clients.length === 0) {
    console.log("No hay clientes en la base de datos.");
    return;
  }

  for (const client of clients) {
    let properties = await prisma.property.findMany({ where: { clientId: client.id } });
    
    // Si el cliente no tiene predios, le creamos uno por defecto
    if (properties.length === 0) {
      const newProperty = await prisma.property.create({
        data: {
          clientId: client.id,
          name: `Predio Principal - ${client.name}`,
          area: "10 Hectáreas",
          environmentalAuthority: "Autoridad Ambiental Local",
          useCurrent: "Mixto",
        }
      });
      properties = [newProperty];
      console.log(`Creado predio por defecto para cliente: ${client.name}`);
    }

    // Para cada predio del cliente, nos aseguramos que tenga un expediente (EnvironmentalFile)
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      const existingFile = await prisma.environmentalFile.findFirst({ where: { propertyId: prop.id } });
      
      if (!existingFile) {
        await prisma.environmentalFile.create({
          data: {
            clientId: client.id,
            propertyId: prop.id,
            internalCode: `ERF-${client.id.substring(0, 4).toUpperCase()}-${new Date().getFullYear()}-00${i+1}`,
            officialCode: `EXP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
            authority: prop.environmentalAuthority || "Autoridad Ambiental Local",
            type: "Trámite Ambiental General",
            status: WorkStatus.PREPARATION,
            priority: Priority.MEDIUM,
            riskLevel: RiskLevel.MEDIUM,
            description: `Expediente simulado para el predio ${prop.name}`
          }
        });
        console.log(`Expediente creado para el predio: ${prop.name} (Cliente: ${client.name})`);
      } else {
        console.log(`El predio ${prop.name} ya tiene un expediente asociado.`);
      }
    }
  }
  
  console.log("Simulación de expedientes completada para todos los clientes.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

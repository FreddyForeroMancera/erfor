import { PrismaClient, WorkStatus, RiskLevel, Priority, ObligationStatus } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany();
  if (clients.length === 0) return;

  const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  const responsibleUserId = adminUser ? adminUser.id : undefined;

  for (const client of clients) {
    // 1. Ensure client has at least one Project (Cotización / Trámite base)
    let project = await prisma.project.findFirst({ where: { clientId: client.id } });
    if (!project) {
      project = await prisma.project.create({
        data: {
          clientId: client.id,
          name: `Proyecto/Cotización Base - ${client.name}`,
          type: "Proyecto de Licenciamiento",
          description: "Proyecto generado automáticamente para agrupar expedientes.",
          status: WorkStatus.PREPARATION,
          riskLevel: RiskLevel.MEDIUM,
          responsibleUserId
        }
      });
      console.log(`Proyecto creado para el cliente: ${client.name}`);
    }

    // 2. Find all expedientes (EnvironmentalFile) for this client
    const files = await prisma.environmentalFile.findMany({ where: { clientId: client.id } });
    
    for (const file of files) {
      // Ensure file is linked to the project
      if (!file.projectId) {
        await prisma.environmentalFile.update({
          where: { id: file.id },
          data: { projectId: project.id }
        });
      }

      // 3. Ensure a Procedure exists (Trámite)
      const procCount = await prisma.procedure.count({ where: { environmentalFileId: file.id } });
      if (procCount === 0) {
        await prisma.procedure.create({
          data: {
            clientId: client.id,
            projectId: project.id,
            environmentalFileId: file.id,
            type: "Permiso Ambiental",
            authority: file.authority || "Autoridad Competente",
            status: WorkStatus.EVALUATION,
            filingNumber: `RAD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
            filingDate: new Date(),
            expectedResponseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
            responsibleUserId,
            riskLevel: RiskLevel.MEDIUM,
            requiredDocuments: "Formulario, Planos, Estudios técnicos",
            deliveredDocuments: "Formulario",
            missingDocuments: "Planos, Estudios técnicos"
          }
        });
      }

      // 4. Ensure a Requirement exists (Requerimiento)
      const reqCount = await prisma.requirement.count({ where: { environmentalFileId: file.id } });
      if (reqCount === 0) {
        await prisma.requirement.create({
          data: {
            clientId: client.id,
            projectId: project.id,
            environmentalFileId: file.id,
            authority: file.authority || "Autoridad Competente",
            subject: "Solicitud de información adicional",
            description: "Se solicita anexar planimetría detallada del área de influencia.",
            status: WorkStatus.REQUIREMENT,
            priority: Priority.HIGH,
            riskLevel: RiskLevel.HIGH,
            responsibleUserId,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // +15 days
          }
        });
      }

      // 5. Ensure an Obligation exists (Obligación)
      const obCount = await prisma.environmentalObligation.count({ where: { clientId: client.id, projectId: project.id } });
      if (obCount === 0) {
        await prisma.environmentalObligation.create({
          data: {
            clientId: client.id,
            projectId: project.id,
            title: "Presentar Informe de Cumplimiento Ambiental (ICA)",
            description: "Generar y radicar el informe anual de cumplimiento según lo estipulado.",
            category: "Seguimiento",
            responsibleUserId,
            status: ObligationStatus.PENDIENTE,
            riskLevel: RiskLevel.MEDIUM,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // +60 days
          }
        });
      }

      // 6. Ensure an Alert exists
      const alertCount = await prisma.alert.count({ where: { environmentalFileId: file.id } });
      if (alertCount === 0) {
        await prisma.alert.create({
          data: {
            type: "DEADLINE",
            title: "Vencimiento próximo de requerimiento",
            description: "El requerimiento actual tiene plazo límite cercano.",
            severity: Priority.HIGH,
            clientId: client.id,
            projectId: project.id,
            environmentalFileId: file.id,
            status: "OPEN",
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }
  }

  console.log("¡Simulación de datos profundos completada para todos los clientes y expedientes!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

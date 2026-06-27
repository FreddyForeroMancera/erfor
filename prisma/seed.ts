import { PrismaClient, Priority, RiskLevel, Role, Status, WorkStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Erfor2026!", 12);

  const erwin = await prisma.user.upsert({
    where: { email: "erwin@erfor.co" },
    update: {},
    create: {
      name: "Erwin Forero",
      email: "erwin@erfor.co",
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: Status.ACTIVE,
      avatar: "/avatar-erwin.svg"
    }
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-client-porvenir" },
    update: {},
    create: {
      id: "seed-client-porvenir",
      name: "Finca El Porvenir",
      type: "Propietario rural",
      documentType: "CC",
      documentNumber: "79800123",
      representative: "Erwin Forero",
      email: "contacto@fincaelporvenir.co",
      phone: "+57 300 000 0000",
      address: "Vereda La Esperanza",
      city: "La Vega",
      department: "Cundinamarca",
      contactPerson: "Administrador del predio",
      status: Status.ACTIVE,
      priority: Priority.HIGH,
      notes: "Cliente con seguimiento prioritario por requerimiento CAR."
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      clientId: client.id,
      name: "Regularización ambiental predio El Porvenir",
      type: "Proyecto rural",
      description: "Gestión integral de expediente, permiso de vertimientos y obligaciones de seguimiento.",
      activity: "Actividad productiva rural",
      location: "Vereda La Esperanza, La Vega",
      city: "La Vega",
      department: "Cundinamarca",
      coordinates: "4.9921,-74.3390",
      environmentalAuthority: "CAR Cundinamarca",
      status: WorkStatus.EVALUATION,
      riskLevel: RiskLevel.HIGH,
      responsibleUserId: erwin.id,
      startDate: new Date("2026-04-01"),
      estimatedEndDate: new Date("2026-09-30")
    }
  });

  const property = await prisma.property.upsert({
    where: { id: "seed-property-1" },
    update: {},
    create: {
      id: "seed-property-1",
      clientId: client.id,
      projectId: project.id,
      name: "Predio El Porvenir",
      cadastralCode: "253770001000000120001000000000",
      realEstateRegistration: "156-123456",
      owner: "Finca El Porvenir",
      area: "18.4 ha",
      useCurrent: "Agropecuario",
      useProposed: "Agropecuario con manejo ambiental",
      address: "Vereda La Esperanza",
      city: "La Vega",
      department: "Cundinamarca",
      village: "La Esperanza",
      coordinates: "4.9921,-74.3390",
      environmentalAuthority: "CAR Cundinamarca",
      environmentalRestrictions: "Revisión de ronda hídrica y manejo de vertimientos.",
      waterSourceProximity: "Quebrada menor a 120 m",
      protectedAreas: "Sin superposición confirmada; pendiente validación cartográfica."
    }
  });

  const file = await prisma.environmentalFile.upsert({
    where: { id: "seed-file-1" },
    update: {},
    create: {
      id: "seed-file-1",
      clientId: client.id,
      projectId: project.id,
      propertyId: property.id,
      internalCode: "ERF-CAR-2026-001",
      officialCode: "EXP-2024-156",
      authority: "CAR Cundinamarca",
      type: "Permiso de vertimientos",
      status: WorkStatus.REQUIREMENT,
      priority: Priority.HIGH,
      riskLevel: RiskLevel.HIGH,
      openedAt: new Date("2026-04-02"),
      filedAt: new Date("2026-04-12"),
      nextDeadline: new Date("2026-05-25"),
      responsibleUserId: erwin.id,
      description: "Expediente en etapa de requerimiento técnico documental.",
      timeline: JSON.stringify(["Preparación", "Radicación", "Evaluación", "Requerimiento"])
    }
  });

  const procedure = await prisma.procedure.upsert({
    where: { id: "seed-procedure-1" },
    update: {},
    create: {
      id: "seed-procedure-1",
      clientId: client.id,
      projectId: project.id,
      environmentalFileId: file.id,
      type: "Permiso de vertimientos",
      authority: "CAR Cundinamarca",
      status: WorkStatus.REQUIREMENT,
      filingNumber: "CAR-2026-004512",
      filingDate: new Date("2026-04-12"),
      expectedResponseDate: new Date("2026-06-12"),
      nextDeadline: new Date("2026-05-25"),
      responsibleUserId: erwin.id,
      riskLevel: RiskLevel.HIGH,
      requiredDocuments: "Caracterización, plano hidráulico, memoria técnica, evidencia fotográfica",
      deliveredDocuments: "Formulario, certificado de tradición, RUT",
      missingDocuments: "Caracterización actualizada y plano hidráulico"
    }
  });

  await prisma.requirement.upsert({
    where: { id: "seed-requirement-1" },
    update: {},
    create: {
      id: "seed-requirement-1",
      clientId: client.id,
      projectId: project.id,
      environmentalFileId: file.id,
      authority: "CAR Cundinamarca",
      filingNumber: "CAR-REQ-2026-0901",
      receivedAt: new Date("2026-05-05"),
      dueDate: new Date("2026-05-25"),
      subject: "Requerimiento de información técnica para permiso de vertimientos",
      description: "La autoridad solicita complementar documentación técnica, soportes del sistema de tratamiento y evidencias fotográficas.",
      requestedDocuments: "Caracterización de vertimiento, memoria técnica, plano, registro fotográfico, certificación del laboratorio",
      status: WorkStatus.REQUIREMENT,
      priority: Priority.HIGH,
      riskLevel: RiskLevel.HIGH,
      responsibleUserId: erwin.id,
      responseText: "Borrador pendiente de validación técnica.",
      extractedJson: JSON.stringify({
        entidad: "CAR Cundinamarca",
        radicado: "CAR-REQ-2026-0901",
        fechaLimite: "2026-05-25",
        tema: "Permiso de vertimientos"
      })
    }
  });

  await prisma.legalRequirement.upsert({
    where: { id: "seed-legal-req-1" },
    update: {},
    create: {
      id: "seed-legal-req-1",
      title: "Gestión de permiso de vertimientos",
      normType: "Decreto",
      normNumber: "1076",
      year: 2015,
      authority: "Ministerio de Ambiente y Desarrollo Sostenible",
      scope: "Nacional",
      category: "Vertimientos",
      obligationText: "Mantener soporte técnico y cumplimiento de condiciones asociadas al vertimiento autorizado.",
      appliesTo: "Proyectos con descarga a suelo o cuerpo de agua",
      evidenceRequired: "Permiso vigente, monitoreos, reportes y evidencias de operación.",
      responsible: "Director Ambiental",
      periodicity: "Según permiso",
      source: "Fuente oficial cargada por administrador",
      status: "PENDING_VALIDATION",
      expertNotes: "Debe validarse contra el expediente y el acto administrativo aplicable."
    }
  });

  await prisma.environmentalObligation.upsert({
    where: { id: "seed-obligation-1" },
    update: {},
    create: {
      id: "seed-obligation-1",
      clientId: client.id,
      projectId: project.id,
      title: "Entregar caracterización actualizada de vertimientos",
      description: "Preparar y radicar caracterización emitida por laboratorio acreditado.",
      category: "Vertimientos",
      responsibleUserId: erwin.id,
      periodicity: "Única",
      startDate: new Date("2026-05-05"),
      dueDate: new Date("2026-05-23"),
      status: "PENDIENTE",
      riskLevel: RiskLevel.HIGH,
      evidenceRequired: "Informe de laboratorio y cadena de custodia.",
      nextAction: "Solicitar documento al cliente y revisar completitud."
    }
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Preparar respuesta al requerimiento CAR",
        description: "Consolidar anexos técnicos y validar fechas antes de radicar.",
        clientId: client.id,
        projectId: project.id,
        environmentalFileId: file.id,
        assignedTo: erwin.id,
        priority: Priority.HIGH,
        status: "OPEN",
        dueDate: new Date("2026-05-22")
      },
      {
        title: "Revisar documentos faltantes del trámite",
        clientId: client.id,
        projectId: project.id,
        environmentalFileId: file.id,
        assignedTo: erwin.id,
        priority: Priority.MEDIUM,
        status: "OPEN",
        dueDate: new Date("2026-05-18")
      }
    ]
  });

  await prisma.alert.createMany({
    data: [
      {
        type: "DEADLINE",
        title: "Requerimiento próximo a vencer",
        description: "El requerimiento CAR-REQ-2026-0901 vence el 25 de mayo de 2026.",
        severity: Priority.HIGH,
        clientId: client.id,
        projectId: project.id,
        environmentalFileId: file.id,
        relatedEntityType: "Requirement",
        status: "OPEN",
        dueDate: new Date("2026-05-25")
      },
      {
        type: "MISSING_DOCUMENT",
        title: "Documento técnico faltante",
        description: "Falta caracterización actualizada para radicar respuesta completa.",
        severity: Priority.MEDIUM,
        clientId: client.id,
        projectId: project.id,
        relatedEntityType: "Procedure",
        relatedEntityId: procedure.id,
        status: "OPEN",
        dueDate: new Date("2026-05-20")
      }
    ]
  });

  await prisma.integrationSource.createMany({
    data: [
      { name: "Excel", type: "EXCEL", status: "CONNECTED" },
      { name: "Google Sheets", type: "GOOGLE_SHEETS", status: "READY" },
      { name: "Fotografías", type: "IMAGES", status: "CONNECTED" },
      { name: "CAR Cundinamarca", type: "AUTHORITY_LINKS", status: "CONFIGURED" },
      { name: "Normativa Legal", type: "LEGAL_REPOSITORY", status: "PENDING_VALIDATION" },
      { name: "SINA", type: "EXTERNAL_SOURCE", status: "CONFIGURED" }
    ]
  });

  await prisma.template.createMany({
    data: [
      {
        name: "Informe Ejecutivo Ambiental",
        type: "EXECUTIVE_REPORT",
        content: "Portada\nResumen ejecutivo\nIndicadores\nHallazgos\nRiesgos\nRecomendaciones\nPróximas acciones"
      },
      {
        name: "Respuesta a requerimiento",
        type: "REQUIREMENT_RESPONSE",
        content: "Entidad\nRadicado relacionado\nAsunto\nRespuesta técnica\nAnexos\nFirma"
      }
    ]
  });

  await prisma.activityLog.create({
    data: {
      userId: erwin.id,
      action: "Configuración Inicial",
      entityType: "System",
      description: "Datos iniciales creados para operación local."
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

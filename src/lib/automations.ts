import { Priority } from "@prisma/client";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export function extractRequirementText(rawText: string) {
  const text = rawText.replace(/\s+/g, " ").trim();
  const radicado = text.match(/(?:radicado|rad)\.?\s*[:#-]?\s*([A-Z0-9-]{5,})/i)?.[1];
  const entity = /CAR\s+Cundinamarca/i.test(text) ? "CAR Cundinamarca" : text.match(/(?:entidad|autoridad)\s*[:#-]?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+)/i)?.[1]?.trim();
  const isoDate = text.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  let deadline = addDays(new Date(), 10);
  if (isoDate) {
    const year = parseInt(isoDate[1], 10);
    const month = parseInt(isoDate[2], 10) - 1;
    const day = parseInt(isoDate[3], 10);
    deadline = new Date(year, month, day);
  }
  const subject = text.match(/(?:asunto|tema)\s*[:#-]?\s*([^.;]{8,120})/i)?.[1]?.trim() || "Requerimiento ambiental cargado";
  return {
    entity: entity || "Entidad ambiental por validar",
    filingNumber: radicado || `REQ-${Date.now()}`,
    dueDate: deadline,
    subject,
    summary: text.slice(0, 900),
    requestedDocuments: ["caracterización", "plano", "soporte", "evidencia", "certificación"].filter((word) =>
      text.toLowerCase().includes(word)
    )
  };
}

export async function createRequirementAutomation(input: {
  userId: string;
  clientId?: string | null;
  projectId?: string | null;
  environmentalFileId?: string | null;
  documentId?: string;
  text: string;
}) {
  const extracted = extractRequirementText(input.text);
  if (!input.clientId) {
    throw new Error("clientId es requerido para ejecutar la automatización de requerimientos.");
  }
  const requirement = await prisma.requirement.create({
    data: {
      clientId: input.clientId,
      projectId: input.projectId || undefined,
      environmentalFileId: input.environmentalFileId || undefined,
      authority: extracted.entity,
      filingNumber: extracted.filingNumber,
      receivedAt: new Date(),
      dueDate: extracted.dueDate,
      subject: extracted.subject,
      description: extracted.summary,
      requestedDocuments: extracted.requestedDocuments.join(", "),
      responsibleUserId: input.userId,
      extractedJson: JSON.stringify(extracted)
    }
  });

  const [alert, task] = await Promise.all([
    prisma.alert.create({
      data: {
        type: "DEADLINE",
        title: `Vencimiento ${extracted.filingNumber}`,
        description: `Responder requerimiento de ${extracted.entity}.`,
        severity: Priority.HIGH,
        clientId: input.clientId || undefined,
        projectId: input.projectId || undefined,
        environmentalFileId: input.environmentalFileId || undefined,
        relatedEntityType: "Requirement",
        relatedEntityId: requirement.id,
        dueDate: extracted.dueDate
      }
    }),
    prisma.task.create({
      data: {
        title: `Preparar respuesta ${extracted.filingNumber}`,
        description: "Tarea generada automáticamente desde documento cargado.",
        clientId: input.clientId || undefined,
        projectId: input.projectId || undefined,
        environmentalFileId: input.environmentalFileId || undefined,
        assignedTo: input.userId,
        priority: Priority.HIGH,
        dueDate: extracted.dueDate
      }
    })
  ]);

  await prisma.activityLog.create({
    data: {
      userId: input.userId,
      action: "AUTOMATION_REQUIREMENT",
      entityType: "Requirement",
      entityId: requirement.id,
      description: "Se extrajo información básica, se creó alerta y tarea asociada."
    }
  });

  return { requirement, alert, task, extracted };
}

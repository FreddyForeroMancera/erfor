import { z } from "zod";
import { prisma } from "@/lib/prisma";

type PrismaDelegate = any;

const optionalDate = z
  .union([z.string().datetime(), z.string().date(), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    return new Date(value);
  });

const base = {
  createdAt: z.never().optional(),
  updatedAt: z.never().optional()
};

export const schemas = {
  clients: z.object({
    name: z.string().min(2),
    type: z.string().default("Persona natural"),
    documentType: z.string().optional().nullable(),
    documentNumber: z.string().optional().nullable(),
    representative: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal("")),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    status: z.string().default("ACTIVE"),
    priority: z.string().default("MEDIUM"),
    notes: z.string().optional().nullable(),
    ...base
  }),
  projects: z.object({
    clientId: z.string().min(1),
    name: z.string().min(2),
    type: z.string().default("Proyecto ambiental"),
    description: z.string().optional().nullable(),
    activity: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    coordinates: z.string().optional().nullable(),
    environmentalAuthority: z.string().default("CAR Cundinamarca"),
    status: z.string().default("PREPARATION"),
    riskLevel: z.string().default("MEDIUM"),
    responsibleUserId: z.string().optional().nullable(),
    startDate: optionalDate,
    estimatedEndDate: optionalDate,
    ...base
  }),
  properties: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional().nullable(),
    name: z.string().min(2),
    cadastralCode: z.string().optional().nullable(),
    realEstateRegistration: z.string().optional().nullable(),
    owner: z.string().optional().nullable(),
    area: z.string().optional().nullable(),
    useCurrent: z.string().optional().nullable(),
    useProposed: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    village: z.string().optional().nullable(),
    coordinates: z.string().optional().nullable(),
    environmentalAuthority: z.string().optional().nullable(),
    environmentalRestrictions: z.string().optional().nullable(),
    waterSourceProximity: z.string().optional().nullable(),
    protectedAreas: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    ...base
  }),
  environmentalFiles: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional().nullable(),
    propertyId: z.string().optional().nullable(),
    internalCode: z.string().min(2),
    officialCode: z.string().optional().nullable(),
    authority: z.string().default("CAR Cundinamarca"),
    type: z.string().min(2),
    status: z.string().default("PREPARATION"),
    priority: z.string().default("MEDIUM"),
    riskLevel: z.string().default("MEDIUM"),
    openedAt: optionalDate,
    filedAt: optionalDate,
    nextDeadline: optionalDate,
    responsibleUserId: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    timeline: z.string().optional().nullable(),
    ...base
  }),
  procedures: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional().nullable(),
    environmentalFileId: z.string().optional().nullable(),
    type: z.string().min(2),
    authority: z.string().default("CAR Cundinamarca"),
    status: z.string().default("DRAFT"),
    filingNumber: z.string().optional().nullable(),
    filingDate: optionalDate,
    expectedResponseDate: optionalDate,
    nextDeadline: optionalDate,
    responsibleUserId: z.string().optional().nullable(),
    riskLevel: z.string().default("MEDIUM"),
    requiredDocuments: z.string().optional().nullable(),
    deliveredDocuments: z.string().optional().nullable(),
    missingDocuments: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    result: z.string().optional().nullable(),
    ...base
  }),
  obligations: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional().nullable(),
    permitId: z.string().optional().nullable(),
    legalRequirementId: z.string().optional().nullable(),
    title: z.string().min(2),
    description: z.string().optional().nullable(),
    category: z.string().default("General"),
    responsibleUserId: z.string().optional().nullable(),
    periodicity: z.string().optional().nullable(),
    startDate: optionalDate,
    dueDate: optionalDate,
    status: z.string().default("IN_RISK"),
    riskLevel: z.string().default("MEDIUM"),
    evidenceRequired: z.string().optional().nullable(),
    evidenceLoaded: z.string().optional().nullable(),
    nextAction: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    ...base
  }),
  requirements: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional().nullable(),
    environmentalFileId: z.string().optional().nullable(),
    authority: z.string().default("CAR Cundinamarca"),
    filingNumber: z.string().optional().nullable(),
    receivedAt: optionalDate,
    dueDate: optionalDate,
    subject: z.string().min(2),
    description: z.string().optional().nullable(),
    requestedDocuments: z.string().optional().nullable(),
    status: z.string().default("REQUIREMENT"),
    priority: z.string().default("HIGH"),
    riskLevel: z.string().default("HIGH"),
    responsibleUserId: z.string().optional().nullable(),
    responseText: z.string().optional().nullable(),
    responseSentAt: optionalDate,
    notes: z.string().optional().nullable(),
    extractedJson: z.string().optional().nullable(),
    ...base
  }),
  permits: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional().nullable(),
    procedureId: z.string().optional().nullable(),
    type: z.string().min(2),
    authority: z.string().default("CAR Cundinamarca"),
    status: z.string().default("APPROVED"),
    issueDate: optionalDate,
    expirationDate: optionalDate,
    renewalDate: optionalDate,
    obligations: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    ...base
  }),
  documents: z.object({
    clientId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    propertyId: z.string().optional().nullable(),
    environmentalFileId: z.string().optional().nullable(),
    procedureId: z.string().optional().nullable(),
    requirementId: z.string().optional().nullable(),
    visitId: z.string().optional().nullable(),
    name: z.string().min(2),
    fileUrl: z.string().min(1),
    fileType: z.string().default("application/octet-stream"),
    category: z.string().default("Documento ambiental"),
    version: z.coerce.number().default(1),
    status: z.string().default("ACTIVE"),
    extractedText: z.string().optional().nullable(),
    tags: z.string().optional().nullable(),
    uploadedBy: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    observations: z.string().optional().nullable(),
    ...base
  }),
  visits: z.object({
    clientId: z.string().min(1),
    projectId: z.string().optional().nullable(),
    propertyId: z.string().optional().nullable(),
    environmentalFileId: z.string().optional().nullable(),
    type: z.string().min(2),
    scheduledAt: optionalDate,
    completedAt: optionalDate,
    attendees: z.string().optional().nullable(),
    objective: z.string().optional().nullable(),
    findings: z.string().optional().nullable(),
    commitments: z.string().optional().nullable(),
    coordinates: z.string().optional().nullable(),
    status: z.string().default("PREPARATION"),
    ...base
  }),
  tasks: z.object({
    title: z.string().min(2),
    description: z.string().optional().nullable(),
    clientId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    environmentalFileId: z.string().optional().nullable(),
    assignedTo: z.string().optional().nullable(),
    priority: z.string().default("MEDIUM"),
    status: z.string().default("OPEN"),
    dueDate: optionalDate,
    completedAt: optionalDate,
    ...base
  }),
  alerts: z.object({
    type: z.string().default("GENERAL"),
    title: z.string().min(2),
    description: z.string().optional().nullable(),
    severity: z.string().default("MEDIUM"),
    clientId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    environmentalFileId: z.string().optional().nullable(),
    relatedEntityType: z.string().optional().nullable(),
    relatedEntityId: z.string().optional().nullable(),
    status: z.string().default("OPEN"),
    dueDate: optionalDate,
    ...base
  }),
  legalRequirements: z.object({
    title: z.string().min(2),
    normType: z.string().default("Norma"),
    normNumber: z.string().optional().nullable(),
    year: z.coerce.number().optional().nullable(),
    authority: z.string().optional().nullable(),
    scope: z.string().default("Nacional"),
    category: z.string().default("General"),
    obligationText: z.string().min(2),
    appliesTo: z.string().optional().nullable(),
    evidenceRequired: z.string().optional().nullable(),
    responsible: z.string().optional().nullable(),
    periodicity: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    status: z.string().default("PENDING_VALIDATION"),
    expertNotes: z.string().optional().nullable(),
    verified: z.coerce.boolean().default(false),
    ...base
  }),
  reports: z.object({
    clientId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    type: z.string().default("EXECUTIVE_REPORT"),
    title: z.string().min(2),
    periodStart: optionalDate,
    periodEnd: optionalDate,
    fileUrl: z.string().optional().nullable(),
    generatedBy: z.string().optional().nullable(),
    status: z.string().default("GENERATED"),
    payload: z.string().optional().nullable(),
    ...base
  })
};

export const resourceMap = {
  clients: { delegate: prisma.client, schema: schemas.clients, search: ["name", "documentNumber"] },
  projects: { delegate: prisma.project, schema: schemas.projects, search: ["name", "client.name"] },
  properties: { delegate: prisma.property, schema: schemas.properties, search: ["client.name"] },
  environmentalFiles: { delegate: prisma.environmentalFile, schema: schemas.environmentalFiles, search: ["internalCode", "officialCode", "client.name"] },
  procedures: { delegate: prisma.procedure, schema: schemas.procedures, search: ["environmentalFile.internalCode", "client.name", "filingNumber"] },
  permits: { delegate: prisma.permit, schema: schemas.permits, search: ["client.name"] },
  obligations: { delegate: prisma.environmentalObligation, schema: schemas.obligations, search: ["title", "client.name"] },
  requirements: { delegate: prisma.requirement, schema: schemas.requirements, search: ["environmentalFile.internalCode", "client.name", "filingNumber"] },
  visits: { delegate: prisma.visit, schema: schemas.visits, search: ["environmentalFile.internalCode", "client.name"] },
  documents: { delegate: prisma.document, schema: schemas.documents, search: ["name", "client.name", "environmentalFile.internalCode"] },
  tasks: { delegate: prisma.task, schema: schemas.tasks, search: ["title", "client.name", "environmentalFile.internalCode"] },
  alerts: { delegate: prisma.alert, schema: schemas.alerts, search: ["title", "client.name", "environmentalFile.internalCode"] },
  legalRequirements: { delegate: prisma.legalRequirement, schema: schemas.legalRequirements, search: ["title"] },
  reports: { delegate: prisma.report, schema: schemas.reports, search: ["title", "client.name"] }
} as Record<string, { delegate: PrismaDelegate; schema: z.ZodTypeAny; search: string[] }>;

export type ResourceName = keyof typeof resourceMap;

export function getResource(resource: string) {
  const config = resourceMap[resource as ResourceName];
  if (!config) throw new Response(JSON.stringify({ error: "Recurso no soportado" }), { status: 404 });
  return config;
}

export function buildWhere(searchParams: URLSearchParams, searchFields: string[]) {
  const q = searchParams.get("q");
  const where: Record<string, unknown> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!value || ["q", "page", "limit"].includes(key)) continue;
    where[key] = value;
  }
  if (q) {
    where.OR = searchFields.map((field) => {
      if (field.includes(".")) {
        const [rel, child] = field.split(".");
        return { [rel]: { [child]: { contains: q, mode: "insensitive" } } };
      }
      return { [field]: { contains: q, mode: "insensitive" } };
    });
  }
  return where;
}

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "select";
  options?: string[];
  required?: boolean;
};

export type ModuleConfig = {
  title: string;
  subtitle: string;
  resource: string;
  fields: Field[];
  columns: string[];
};

const statusOptions = ["DRAFT", "PREPARATION", "FILED", "EVALUATION", "REQUIREMENT", "RESPONDED", "VISIT", "TECHNICAL_CONCEPT", "APPROVED", "DENIED", "SUSPENDED", "ARCHIVED", "COMPLETED"];
const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const riskOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const moduleConfigs: Record<string, ModuleConfig> = {
  "clientes-y-proyectos": {
    title: "Clientes y Proyectos",
    subtitle: "CRM ambiental para clientes, contactos y proyectos.",
    resource: "clients",
    columns: ["name", "type", "documentNumber", "city", "priority", "status"],
    fields: [
      { name: "name", label: "Nombre o razón social", required: true },
      { name: "type", label: "Tipo de cliente", type: "select", options: ["Persona natural", "Empresa", "Constructora", "Propietario rural", "Finca", "Proyecto productivo", "Entidad", "Otro"] },
      { name: "documentType", label: "Tipo documento" },
      { name: "documentNumber", label: "NIT o documento" },
      { name: "representative", label: "Representante legal" },
      { name: "email", label: "Correo" },
      { name: "phone", label: "Teléfono" },
      { name: "address", label: "Dirección" },
      { name: "city", label: "Municipio" },
      { name: "department", label: "Departamento" },
      { name: "priority", label: "Prioridad", type: "select", options: priorityOptions },
      { name: "notes", label: "Notas internas", type: "textarea" }
    ]
  },

  "requisitos-legales": {
    title: "Requisitos Legales",
    subtitle: "Matriz legal administrable y validada por experto.",
    resource: "legalRequirements",
    columns: ["title", "normType", "year", "scope", "category", "status"],
    fields: [
      { name: "title", label: "Norma", required: true },
      { name: "normType", label: "Tipo de norma" },
      { name: "normNumber", label: "Número" },
      { name: "year", label: "Año" },
      { name: "authority", label: "Entidad emisora" },
      { name: "scope", label: "Ámbito" },
      { name: "category", label: "Categoría" },
      { name: "obligationText", label: "Obligación derivada", type: "textarea", required: true },
      { name: "evidenceRequired", label: "Evidencia requerida", type: "textarea" },
      { name: "source", label: "Fuente" },
      { name: "expertNotes", label: "Notas del experto", type: "textarea" }
    ]
  },
  "tramites-y-permisos": {
    title: "Trámites y Permisos",
    subtitle: "Seguimiento a trámites, permisos, checklists y vencimientos.",
    resource: "procedures",
    columns: ["type", "authority", "filingNumber", "status", "nextDeadline", "riskLevel"],
    fields: [
      { name: "clientId", label: "ID cliente", required: true },
      { name: "projectId", label: "ID proyecto" },
      { name: "environmentalFileId", label: "ID expediente" },
      { name: "type", label: "Tipo de trámite", required: true },
      { name: "authority", label: "Entidad" },
      { name: "status", label: "Estado", type: "select", options: statusOptions },
      { name: "filingNumber", label: "Radicado" },
      { name: "filingDate", label: "Fecha radicación", type: "date" },
      { name: "nextDeadline", label: "Próximo vencimiento", type: "date" },
      { name: "riskLevel", label: "Riesgo", type: "select", options: riskOptions },
      { name: "requiredDocuments", label: "Documentos requeridos", type: "textarea" },
      { name: "missingDocuments", label: "Documentos faltantes", type: "textarea" }
    ]
  },
  "obligaciones-ambientales": {
    title: "Obligaciones Ambientales",
    subtitle: "Sistema de cumplimiento, recurrencias y evidencias.",
    resource: "obligations",
    columns: ["title", "category", "status", "riskLevel", "dueDate"],
    fields: [
      { name: "clientId", label: "ID cliente", required: true },
      { name: "projectId", label: "ID proyecto" },
      { name: "title", label: "Obligación", required: true },
      { name: "category", label: "Categoría ambiental" },
      { name: "periodicity", label: "Periodicidad" },
      { name: "dueDate", label: "Vencimiento", type: "date" },
      { name: "status", label: "Estado" },
      { name: "riskLevel", label: "Riesgo", type: "select", options: riskOptions },
      { name: "evidenceRequired", label: "Evidencia requerida", type: "textarea" },
      { name: "nextAction", label: "Próxima acción", type: "textarea" }
    ]
  },
  requerimientos: {
    title: "Requerimientos",
    subtitle: "Administración de requerimientos, respuestas y vencimientos.",
    resource: "requirements",
    columns: ["subject", "authority", "filingNumber", "status", "dueDate", "riskLevel"],
    fields: [
      { name: "clientId", label: "ID cliente", required: true },
      { name: "projectId", label: "ID proyecto" },
      { name: "environmentalFileId", label: "ID expediente" },
      { name: "authority", label: "Entidad" },
      { name: "filingNumber", label: "Radicado" },
      { name: "receivedAt", label: "Fecha recepción", type: "date" },
      { name: "dueDate", label: "Fecha límite", type: "date" },
      { name: "subject", label: "Asunto", required: true },
      { name: "requestedDocuments", label: "Documentos solicitados", type: "textarea" },
      { name: "responseText", label: "Respuesta preparada", type: "textarea" }
    ]
  },

  documentos: {
    title: "Documentos",
    subtitle: "Gestor documental con carga, clasificación y búsqueda.",
    resource: "documents",
    columns: ["name", "category", "fileType", "version", "status", "createdAt"],
    fields: [
      { name: "name", label: "Nombre", required: true },
      { name: "fileUrl", label: "URL archivo", required: true },
      { name: "fileType", label: "Tipo" },
      { name: "category", label: "Categoría" },
      { name: "tags", label: "Etiquetas" },
      { name: "extractedText", label: "Texto extraído", type: "textarea" }
    ]
  },
  "informes-y-reportes": {
    title: "Informes y Reportes",
    subtitle: "Constructor de PDF/Excel y biblioteca de reportes.",
    resource: "reports",
    columns: ["title", "type", "status", "generatedAt", "fileUrl"],
    fields: [
      { name: "title", label: "Título", required: true },
      { name: "type", label: "Tipo de informe" },
      { name: "clientId", label: "ID cliente" },
      { name: "projectId", label: "ID proyecto" },
      { name: "status", label: "Estado" }
    ]
  }
};

export const aliases: Record<string, string> = {
  "car-cundinamarca": "tramites-y-permisos",
  "pqrs-respuestas": "requerimientos",
  "monitoreos-y-reportes": "obligaciones-ambientales",
  "fuentes-de-informacion": "documentos",
  integraciones: "documentos",
  configuracion: "requisitos-legales"
};

export function getModule(slug: string) {
  return moduleConfigs[slug] || moduleConfigs[aliases[slug]] || moduleConfigs["clientes-y-proyectos"];
}

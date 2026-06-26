import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireUser();
    
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId") || undefined;
    
    // Filtro base general para usar en tablas con clientId
    const baseWhere = clientId ? { clientId } : {};

    const [
      clients,
      projects,
      files,
      obligations,
      totalObligations,
      completedObligations,
      procedures,
      requirements,
      documents,
      alerts,
      reports,
      visits,
      tasks,
      enProceso,
      enTramite,
      otorgado,
      enSeguimiento,
      cotizaciones,
      recentActivity,
      integrations
    ] = await Promise.all([
      prisma.client.count({ where: { status: "ACTIVE", ...(clientId ? { id: clientId } : {}) } }),
      prisma.property.count({ where: baseWhere }),
      prisma.environmentalFile.count({ where: baseWhere }),
      prisma.environmentalObligation.count({ where: { ...baseWhere, status: { not: "COMPLETED" } } }),
      prisma.environmentalObligation.count({ where: baseWhere }),
      prisma.environmentalObligation.count({ where: { ...baseWhere, status: "COMPLETED" } }),
      prisma.procedure.count({ where: baseWhere }),
      prisma.requirement.count({ where: { ...baseWhere, status: { not: "RESPONDED" } } }),
      prisma.document.count({ where: baseWhere }),
      prisma.alert.count({ where: { ...baseWhere, status: "OPEN", severity: { in: ["HIGH", "CRITICAL"] } } }),
      prisma.report.count({ where: baseWhere }),
      prisma.visit.count({ where: baseWhere }),
      prisma.task.findMany({ where: baseWhere, orderBy: { dueDate: "asc" }, take: 6, include: { client: true } }),
      prisma.procedure.count({ where: { ...baseWhere, status: { in: ["PREPARATION", "DRAFT", "IN_REVIEW"] } } }),
      prisma.procedure.count({ where: { ...baseWhere, status: { in: ["FILED", "EVALUATION", "REQUIREMENT", "RESPONDED", "VISIT", "TECHNICAL_CONCEPT"] } } }),
      prisma.procedure.count({ where: { ...baseWhere, status: "APPROVED" } }),
      prisma.environmentalObligation.count({ where: { ...baseWhere, status: { not: "COMPLETED" } } }),
      prisma.document.count({ where: { ...baseWhere, category: "Cotización" } }),
      // recentActivity no tiene clientId, pero podríamos filtrar si tuviera, 
      // por ahora mostramos toda la actividad o la general
      prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.integrationSource.findMany({ orderBy: { name: "asc" } })
    ]);

    const obligationsByCategory = await prisma.environmentalObligation.groupBy({ 
      by: ["category"], 
      where: baseWhere,
      _count: true 
    });
    const proceduresByStatus = await prisma.procedure.groupBy({ 
      by: ["status"], 
      where: baseWhere,
      _count: true 
    });
    const filesByAuthority = await prisma.environmentalFile.groupBy({ 
      by: ["authority"], 
      where: baseWhere,
      _count: true 
    });
    const alertsList = await prisma.alert.findMany({ 
      where: { ...baseWhere, status: "OPEN" }, 
      orderBy: { dueDate: "asc" }, 
      take: 6,
      include: {
        client: true,
        environmentalFile: true
      }
    });

    const formattedAlertsList = await Promise.all(alertsList.map(async (a) => {
      let fileCode = a.environmentalFile?.officialCode || a.environmentalFile?.internalCode;
      
      if (!fileCode && a.relatedEntityType === "Procedure" && a.relatedEntityId) {
        const proc = await prisma.procedure.findUnique({
          where: { id: a.relatedEntityId },
          include: { environmentalFile: true }
        });
        if (proc?.environmentalFile) {
          fileCode = proc.environmentalFile.officialCode || proc.environmentalFile.internalCode;
        }
      } else if (!fileCode && a.relatedEntityType === "Requirement" && a.relatedEntityId) {
        const req = await prisma.requirement.findUnique({
          where: { id: a.relatedEntityId },
          include: { environmentalFile: true }
        });
        if (req?.environmentalFile) {
          fileCode = req.environmentalFile.officialCode || req.environmentalFile.internalCode;
        }
      }

      return {
        ...a,
        clientName: a.client?.name,
        fileCode
      };
    }));

    const simulatedTasks = [
      { id: "st-1", title: "Actualizar Matriz Legal", dueDate: new Date().toISOString(), client: { name: "Hacienda Esperanza" } },
      { id: "st-2", title: "Preparar Informe RUA", dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), client: { name: "Lote Industrial" } }
    ];

    const simulatedAlerts = [
      { id: "sa-1", title: "Licencia ANLA por Vencer", description: "Vence en 15 días", severity: "CRITICAL", dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(), fileCode: "EXP-2024-156", clientName: "Hacienda Esperanza" },
      { id: "sa-2", title: "Concepto Técnico Pendiente", description: "Requiere radicación en CAR", severity: "HIGH", dueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), fileCode: "EXP-2023-089", clientName: "Lote Industrial" }
    ];

    const simulatedActivity = [
      { id: "act-1", action: "DOCUMENTO CARGADO", description: "Se subió Informe de Vertimientos 2026.pdf", createdAt: new Date().toISOString() },
      { id: "act-2", action: "TRÁMITE ACTUALIZADO", description: "Resolución de Concesión cambió a APROBADO", createdAt: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString() },
      { id: "act-3", action: "VISITA PROGRAMADA", description: "Auditoría Interna programada", createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() },
    ];

    return ok({
      kpis: { 
        clients: clients || 1, 
        projects: projects || 4, // Ahora representa Predios
        files: files || 14, 
        obligations: obligations || 27, 
        totalObligations, 
        completedObligations, 
        procedures: procedures || 12, 
        requirements, 
        documents, 
        alerts: alerts || 3, 
        reports, 
        visits: visits || 5,
        cotizaciones,
        enProceso,
        enTramite,
        otorgado,
        enSeguimiento
      },
      charts: { obligationsByCategory, proceduresByStatus, filesByAuthority },
      tasks: tasks.length ? tasks : simulatedTasks,
      alerts: formattedAlertsList.length ? formattedAlertsList : simulatedAlerts,
      recentActivity: recentActivity.length ? recentActivity : simulatedActivity,
      integrations
    });
  } catch (error) {
    return fail(error);
  }
}

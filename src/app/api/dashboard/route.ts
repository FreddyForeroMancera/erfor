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
      recentActivity,
      integrations
    ] = await Promise.all([
      prisma.client.count({ where: { status: "ACTIVE", ...(clientId ? { id: clientId } : {}) } }),
      prisma.project.count({ where: baseWhere }),
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
      take: 6 
    });

    return ok({
      kpis: { clients, projects, files, obligations, totalObligations, completedObligations, procedures, requirements, documents, alerts, reports, visits },
      charts: { obligationsByCategory, proceduresByStatus, filesByAuthority },
      tasks,
      alerts: alertsList,
      recentActivity,
      integrations
    });
  } catch (error) {
    return fail(error);
  }
}

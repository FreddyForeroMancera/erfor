import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId") || undefined;
    const baseWhere = clientId ? { clientId } : {};

    const [tasks, alerts, visits, procedures, obligations] = await Promise.all([
      prisma.task.findMany({
        where: { ...baseWhere, dueDate: { not: null } },
        select: { id: true, title: true, dueDate: true, status: true, priority: true }
      }),
      prisma.alert.findMany({
        where: { ...baseWhere, dueDate: { not: null } },
        select: { id: true, title: true, dueDate: true, status: true, severity: true }
      }),
      prisma.visit.findMany({
        where: { ...baseWhere, scheduledAt: { not: null } },
        select: { id: true, type: true, scheduledAt: true, status: true }
      }),
      prisma.procedure.findMany({
        where: { ...baseWhere, nextDeadline: { not: null } },
        select: { id: true, type: true, nextDeadline: true, status: true }
      }),
      prisma.environmentalObligation.findMany({
        where: { ...baseWhere, dueDate: { not: null } },
        select: { id: true, title: true, dueDate: true, status: true, riskLevel: true }
      })
    ]);

    const events = [
      ...tasks.map(t => ({ id: `task-${t.id}`, type: "TAREA", title: t.title, date: t.dueDate, status: t.status, priority: t.priority })),
      ...alerts.map(a => ({ id: `alert-${a.id}`, type: "ALERTA", title: a.title, date: a.dueDate, status: a.status, priority: a.severity })),
      ...visits.map(v => ({ id: `visit-${v.id}`, type: "VISITA", title: `Visita: ${v.type}`, date: v.scheduledAt, status: v.status, priority: "MEDIUM" })),
      ...procedures.map(p => ({ id: `procedure-${p.id}`, type: "TRAMITE", title: `Vencimiento Trámite: ${p.type}`, date: p.nextDeadline, status: p.status, priority: "HIGH" })),
      ...obligations.map(o => ({ id: `obligation-${o.id}`, type: "OBLIGACION", title: o.title, date: o.dueDate, status: o.status, priority: o.riskLevel }))
    ];

    const simulatedEvents = [
      { id: "sim-1", type: "ALERTA", title: "Vencimiento Licencia Ambiental ANLA", date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), status: "PENDING", priority: "CRITICAL" },
      { id: "sim-2", type: "VISITA", title: "Inspección CAR Cundinamarca", date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(), status: "SCHEDULED", priority: "HIGH" },
      { id: "sim-3", type: "TRAMITE", title: "Renovación Permiso Vertimientos SDA", date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(), status: "PENDING", priority: "MEDIUM" },
      { id: "sim-4", type: "OBLIGACION", title: "Reporte mensual RUA", date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), status: "PENDING", priority: "HIGH" },
      { id: "sim-5", type: "TAREA", title: "Revisar matrices legales de predios", date: new Date().toISOString(), status: "PENDING", priority: "LOW" },
      { id: "sim-6", type: "ALERTA", title: "Respuesta a Requerimiento PQR 1204", date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), status: "OVERDUE", priority: "CRITICAL" },
      { id: "sim-7", type: "VISITA", title: "Auditoría Interna ISO 14001", date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(), status: "SCHEDULED", priority: "MEDIUM" },
      { id: "sim-8", type: "TRAMITE", title: "Radicar concepto técnico ICA", date: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(), status: "PENDING", priority: "HIGH" },
    ];

    return ok([...events, ...simulatedEvents]);
  } catch (error) {
    return fail(error);
  }
}

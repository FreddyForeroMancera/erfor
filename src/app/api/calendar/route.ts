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

    return ok(events);
  } catch (error) {
    return fail(error);
  }
}

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

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { title, date, type, priority, clientId } = body;

    if (!title || !date || !type || !priority) {
      return Response.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const parsedDate = new Date(date);

    if (type === "TAREA") {
      const task = await prisma.task.create({
        data: {
          title,
          dueDate: parsedDate,
          priority: priority as any,
          status: "OPEN",
          clientId: clientId || undefined,
          assignedTo: user.id,
        },
      });
      return ok({ id: `task-${task.id}`, type: "TAREA", title: task.title, date: task.dueDate, status: task.status, priority: task.priority });
    } else if (type === "ALERTA") {
      const alert = await prisma.alert.create({
        data: {
          type: "MANUAL",
          title,
          dueDate: parsedDate,
          severity: priority as any,
          status: "OPEN",
          clientId: clientId || undefined,
        },
      });
      return ok({ id: `alert-${alert.id}`, type: "ALERTA", title: alert.title, date: alert.dueDate, status: alert.status, priority: alert.severity });
    } else if (type === "VISITA") {
      let actualClientId = clientId;
      if (!actualClientId) {
        // Find any client if none provided (fallback for general calendar)
        const firstClient = await prisma.client.findFirst();
        if (!firstClient) return Response.json({ error: "No hay clientes en el sistema para asociar la visita" }, { status: 400 });
        actualClientId = firstClient.id;
      }
      
      const visit = await prisma.visit.create({
        data: {
          type: title,
          scheduledAt: parsedDate,
          status: "PREPARATION",
          clientId: actualClientId,
        },
      });
      return ok({ id: `visit-${visit.id}`, type: "VISITA", title: `Visita: ${visit.type}`, date: visit.scheduledAt, status: visit.status, priority: "MEDIUM" });
    }

    return Response.json({ error: "Tipo de evento no soportado" }, { status: 400 });
  } catch (error) {
    return fail(error);
  }
}

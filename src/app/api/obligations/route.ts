import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const fileId = url.searchParams.get("fileId");

    if (!fileId) {
      return Response.json({ error: "fileId is required" }, { status: 400 });
    }

    const file = await prisma.environmentalFile.findUnique({ where: { id: fileId } });
    if (!file) {
      return Response.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    // Buscar por projectId si existe, de lo contrario por clientId
    const whereClause = file.projectId
      ? { projectId: file.projectId }
      : { clientId: file.clientId, projectId: null };

    let obligations = await prisma.environmentalObligation.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" }
    });

    if (obligations.length === 0) {
      // Crear obligaciones por defecto
      const defaults = [
        { title: "Compensación", category: "Compensación", status: "PENDIENTE" as const, riskLevel: "MEDIUM" as const },
        { title: "Sistema de Medición", category: "Sistema de Medición", status: "CUMPLIDO" as const, riskLevel: "LOW" as const },
        { title: "PUEAA", category: "PUEAA", status: "PENDIENTE" as const, riskLevel: "HIGH" as const },
        { title: "Consumos", category: "Consumos", status: "NO_CUMPLIDO" as const, riskLevel: "HIGH" as const },
        { title: "Cuadro de Costos", category: "Cuadro de Costos", status: "PENDIENTE" as const, riskLevel: "MEDIUM" as const },
        { title: "Obras de Captación en Obras", category: "Obras de Captación en Obras", status: "PENDIENTE" as const, riskLevel: "MEDIUM" as const },
        { title: "Reporte de Consumos", category: "Reporte de Consumos", status: "PENDIENTE" as const, riskLevel: "MEDIUM" as const }
      ];

      await prisma.environmentalObligation.createMany({
        data: defaults.map(d => ({
          ...d,
          clientId: file.clientId,
          projectId: file.projectId ?? undefined
        }))
      });

      obligations = await prisma.environmentalObligation.findMany({
        where: whereClause,
        orderBy: { createdAt: "asc" }
      });
    }

    return ok(obligations);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUser();
    const { id, status, date, resolution, note } = await request.json();

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const updated = await prisma.environmentalObligation.update({
      where: { id },
      data: {
        status: status || undefined,
        dueDate: date ? new Date(date) : undefined,
        resolutionNumber: resolution !== undefined ? resolution : undefined,
        comments: note !== undefined ? note : undefined
      }
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

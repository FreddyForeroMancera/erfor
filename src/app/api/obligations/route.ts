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
    if (!file || !file.projectId) {
      return Response.json({ error: "File not found or no project associated" }, { status: 404 });
    }

    let obligations = await prisma.environmentalObligation.findMany({
      where: { projectId: file.projectId },
      orderBy: { createdAt: "asc" }
    });

    if (obligations.length === 0) {
      // Default obligations
      const defaults = [
        { title: "Compensación", category: "Compensación", status: "PENDIENTE" as const, riskLevel: "MEDIUM" as const },
        { title: "Sistema de Medición", category: "Sistema de Medición", status: "CUMPLIDO" as const, riskLevel: "LOW" as const },
        { title: "PUEAA", category: "PUEAA", status: "PENDIENTE" as const, riskLevel: "HIGH" as const },
        { title: "Consumos", category: "Consumos", status: "NO_CUMPLIDO" as const, riskLevel: "HIGH" as const },
        { title: "Cuadro de Costos", category: "Cuadro de Costos", status: "PENDIENTE" as const, riskLevel: "MEDIUM" as const },
        { title: "Obras de Captación", category: "Obras de Captación", status: "PENDIENTE" as const, riskLevel: "MEDIUM" as const }
      ];

      await prisma.environmentalObligation.createMany({
        data: defaults.map(d => ({
          ...d,
          clientId: file.clientId,
          projectId: file.projectId
        }))
      });

      obligations = await prisma.environmentalObligation.findMany({
        where: { projectId: file.projectId },
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

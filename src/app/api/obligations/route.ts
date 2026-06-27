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

    let obligations = await prisma.environmentalObligation.findMany({
      where: { environmentalFileId: fileId },
      orderBy: { createdAt: "asc" }
    });

    if (obligations.length === 0) {
      // Default obligations
      const defaults = [
        { title: "Compensación", category: "Compensación", status: "PENDIENTE", riskLevel: "MEDIUM" },
        { title: "Sistema de Medición", category: "Sistema de Medición", status: "CUMPLIDO", riskLevel: "LOW" },
        { title: "PUEAA", category: "PUEAA", status: "PENDIENTE", riskLevel: "HIGH" },
        { title: "Consumos", category: "Consumos", status: "NO_CUMPLIDO", riskLevel: "HIGH" },
        { title: "Cuadro de Costos", category: "Cuadro de Costos", status: "PENDIENTE", riskLevel: "MEDIUM" },
        { title: "Obras de Captación", category: "Obras de Captación", status: "PENDIENTE", riskLevel: "MEDIUM" }
      ];
      
      const file = await prisma.environmentalFile.findUnique({ where: { id: fileId } });
      if (!file) return Response.json({ error: "File not found" }, { status: 404 });

      await prisma.environmentalObligation.createMany({
        data: defaults.map(d => ({
          ...d,
          environmentalFileId: fileId,
          clientId: file.clientId,
          projectId: file.projectId
        }))
      });

      obligations = await prisma.environmentalObligation.findMany({
        where: { environmentalFileId: fileId },
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

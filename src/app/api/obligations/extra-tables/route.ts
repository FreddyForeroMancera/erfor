import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/obligations/extra-tables?fileId=&category=
 * Lee una tabla auxiliar del módulo de Obligaciones guardada en Document.extractedText.
 * Las categorías válidas son: CUADRO_COSTOS, OBRAS_CAPTACION, REPORTE_CONSUMOS
 */
export async function GET(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const fileId = url.searchParams.get("fileId");
    const category = url.searchParams.get("category");

    if (!fileId || !category) {
      return Response.json({ error: "fileId and category are required" }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: {
        environmentalFileId: fileId,
        category,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!document || !document.extractedText) {
      return ok([]);
    }

    try {
      return ok(JSON.parse(document.extractedText));
    } catch {
      return ok([]);
    }
  } catch (error) {
    return fail(error);
  }
}

/**
 * PUT /api/obligations/extra-tables
 * Guarda (upsert) los datos de una tabla auxiliar del módulo de Obligaciones.
 * Body: { fileId: string, category: string, rows: any[] }
 */
export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const { fileId, category, rows } = await request.json();

    if (!fileId || !category || !Array.isArray(rows)) {
      return Response.json(
        { error: "fileId, category and rows are required" },
        { status: 400 }
      );
    }

    const file = await prisma.environmentalFile.findUnique({
      where: { id: fileId },
    });
    if (!file) {
      return Response.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    const existing = await prisma.document.findFirst({
      where: { environmentalFileId: fileId, category },
    });

    if (existing) {
      await prisma.document.update({
        where: { id: existing.id },
        data: { extractedText: JSON.stringify(rows) },
      });
    } else {
      const categoryLabels: Record<string, string> = {
        CUADRO_COSTOS: "Cuadro de Costos",
        OBRAS_CAPTACION: "Obras de Captación",
        REPORTE_CONSUMOS: "Reporte de Consumos",
      };
      await prisma.document.create({
        data: {
          name: categoryLabels[category] ?? category,
          fileUrl: "",
          fileType: "application/json",
          category,
          uploadedBy: user.id,
          source: "GENERATED",
          extractedText: JSON.stringify(rows),
          clientId: file.clientId,
          projectId: file.projectId ?? undefined,
          environmentalFileId: fileId,
        },
      });
    }

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

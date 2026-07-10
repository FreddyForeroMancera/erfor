import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const pendingReprocess = url.searchParams.get("pendingReprocess") === "true";

    if (pendingReprocess) {
      const items = await prisma.document.findMany({
        where: {
          fileUrl: {
            notIn: ["PURGED"],
            startsWith: "http"
          },
          OR: [
            { extractedText: null },
            { extractedText: "" },
            { extractedText: { startsWith: "Archivo cargado:" } },
            { extractedText: { startsWith: "PDF escaneado:" } }
          ]
        },
        orderBy: { createdAt: "desc" }
      });
      return ok({ items, total: items.length });
    }

    const environmentalFileId = url.searchParams.get("environmentalFileId");
    const category = url.searchParams.get("category");
    
    if (!environmentalFileId) {
      return fail(new Error("Falta el ID del expediente"));
    }

    const where: any = { environmentalFileId };
    
    if (category) {
      where.category = category;
    }

    const items = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
    
    return ok({ items, total: items.length });
  } catch (error) {
    return fail(error);
  }
}

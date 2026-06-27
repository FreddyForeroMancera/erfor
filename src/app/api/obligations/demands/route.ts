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

    const document = await prisma.document.findFirst({
      where: { 
        environmentalFileId: fileId,
        category: "DEMANDA_HIDRICA"
      },
      orderBy: { createdAt: "desc" }
    });

    if (!document || !document.extractedText) {
      return ok([
        { id: '1', uso: 'Pecuario', ltsSeg: '0,03', m3Dia: '2,6', m3Mes: '78' },
        { id: '2', uso: 'Riego', ltsSeg: '0,9', m3Dia: '77,8', m3Mes: '2.334' },
        { id: '3', uso: 'Uso doméstico', ltsSeg: '', m3Dia: '', m3Mes: '' },
        { id: '4', uso: '', ltsSeg: '', m3Dia: '', m3Mes: '' }
      ]);
    }

    return ok(JSON.parse(document.extractedText));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const { fileId, demands } = await request.json();

    if (!fileId || !demands) {
      return Response.json({ error: "fileId and demands are required" }, { status: 400 });
    }

    const file = await prisma.environmentalFile.findUnique({ where: { id: fileId } });
    if (!file) return Response.json({ error: "File not found" }, { status: 404 });

    const document = await prisma.document.findFirst({
      where: { 
        environmentalFileId: fileId,
        category: "DEMANDA_HIDRICA"
      }
    });

    if (document) {
      await prisma.document.update({
        where: { id: document.id },
        data: { extractedText: JSON.stringify(demands) }
      });
    } else {
      await prisma.document.create({
        data: {
          name: "Demanda Hídrica",
          fileUrl: "",
          fileType: "application/json",
          category: "DEMANDA_HIDRICA",
          uploadedBy: user.id,
          source: "GENERATED",
          extractedText: JSON.stringify(demands),
          clientId: file.clientId,
          projectId: file.projectId,
          environmentalFileId: fileId
        }
      });
    }

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

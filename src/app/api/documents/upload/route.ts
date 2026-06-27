import fs from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";
import { createRequirementAutomation } from "@/lib/automations";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ensureDir } from "@/lib/report";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Archivo requerido" }, { status: 400 });

    const uploadRoot = process.env.UPLOAD_DIR || "./uploads";
    const dir = path.resolve(process.cwd(), uploadRoot, "documents");
    await ensureDir(dir);
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${Date.now()}-${safeName}`;
    await fs.writeFile(path.join(dir, storedName), bytes);

    const extractedText = await extractTextLike(file, bytes);
    const document = await prisma.document.create({
      data: {
        clientId: String(form.get("clientId") || "") || undefined,
        projectId: String(form.get("projectId") || "") || undefined,
        environmentalFileId: String(form.get("environmentalFileId") || "") || undefined,
        requirementId: String(form.get("requirementId") || "") || undefined,
        visitId: String(form.get("visitId") || "") || undefined,
        name: file.name,
        fileUrl: `/uploads/documents/${storedName}`,
        fileType: file.type || "application/octet-stream",
        category: String(form.get("category") || "Documento ambiental"),
        extractedText,
        tags: String(form.get("tags") || ""),
        uploadedBy: user.id,
        source: "UPLOAD"
      }
    });

    let automation = null;
    if (/requerimiento/i.test(document.category) || /requerimiento|radicado|CAR/i.test(extractedText)) {
      const clientId = document.clientId;
      if (clientId) {
        automation = await createRequirementAutomation({
          userId: user.id,
          clientId,
          projectId: document.projectId,
          environmentalFileId: document.environmentalFileId,
          documentId: document.id,
          text: extractedText || file.name
        });
      }
    }

    return ok({ document, automation }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

async function extractTextLike(file: File, bytes: Buffer) {
  if (/text|json|csv/i.test(file.type)) return bytes.toString("utf8").slice(0, 10000);
  return `Archivo cargado: ${file.name}. OCR avanzado pendiente de configurar. Use IA ERFOR con metadatos y texto extraído disponible.`;
}

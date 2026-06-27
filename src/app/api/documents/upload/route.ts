import { requireUser } from "@/lib/auth";
import { createRequirementAutomation } from "@/lib/automations";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Inicializar cliente Supabase solo si existen las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Archivo requerido" }, { status: 400 });

    if (!supabase) {
      return Response.json({ error: "Supabase no está configurado en las variables de entorno." }, { status: 500 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${Date.now()}-${safeName}`;
    
    // Subir a Supabase Storage (bucket: erfor-uploads)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("erfor-uploads")
      .upload(`documents/${storedName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      return Response.json({ error: "Error subiendo archivo a Supabase Storage" }, { status: 500 });
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from("erfor-uploads")
      .getPublicUrl(`documents/${storedName}`);

    const extractedText = await extractTextLike(file, bytes);
    const document = await prisma.document.create({
      data: {
        clientId: String(form.get("clientId") || "") || undefined,
        projectId: String(form.get("projectId") || "") || undefined,
        environmentalFileId: String(form.get("environmentalFileId") || "") || undefined,
        requirementId: String(form.get("requirementId") || "") || undefined,
        visitId: String(form.get("visitId") || "") || undefined,
        name: file.name,
        fileUrl: publicUrlData.publicUrl,
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

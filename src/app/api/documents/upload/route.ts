import { requireUser } from "@/lib/auth";
import { createRequirementAutomation } from "@/lib/automations";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
const pdfParse = require("pdf-parse");

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Archivo requerido" }, { status: 400 });

    // 1. Evitar duplicados: Verificar si ya existe un documento con ese nombre en ese expediente
    const environmentalFileId = String(form.get("environmentalFileId") || "");
    if (environmentalFileId) {
      const existingDoc = await prisma.document.findFirst({
        where: {
          name: file.name,
          environmentalFileId: environmentalFileId
        }
      });
      
      if (existingDoc) {
        return Response.json({ error: "Este documento ya fue subido y analizado previamente." }, { status: 400 });
      }
    }

    // Inicializar cliente Supabase dentro del handler para evitar errores en build time
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: "Supabase no está configurado en las variables de entorno." }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Obtener URL pública (Opcional si vamos a borrar, pero mantenemos por si se requiere logs)
    const { data: publicUrlData } = supabase.storage
      .from("erfor-uploads")
      .getPublicUrl(`documents/${storedName}`);

    // Extraer texto (Análisis con IA u OCR)
    const extractedText = await extractTextLike(file, bytes);
    
    // Calcular cuota de almacenamiento actual (Límite sugerido: 900 MB)
    const quotaThresholdBytes = 900 * 1024 * 1024; // 900 MB
    const fileSizeBytes = file.size;
    
    const usageResult = await prisma.document.aggregate({
      _sum: { fileSize: true },
      where: { fileUrl: { not: "PURGED" } }
    });
    const currentUsageBytes = usageResult._sum.fileSize || 0;
    const willExceedQuota = (currentUsageBytes + fileSizeBytes) > quotaThresholdBytes;

    let finalFileUrl = publicUrlData.publicUrl;

    if (willExceedQuota) {
      // BORRAR EL ARCHIVO FÍSICO DE SUPABASE PARA AHORRAR ESPACIO
      const { error: deleteError } = await supabase.storage
        .from("erfor-uploads")
        .remove([`documents/${storedName}`]);

      if (deleteError) {
        console.error("No se pudo purgar el archivo físico de Supabase:", deleteError);
      }
      finalFileUrl = "PURGED"; // Marcamos que el archivo físico fue eliminado
    }

    // Guardar metadata en la base de datos
    const document = await prisma.document.create({
      data: {
        clientId: String(form.get("clientId") || "") || undefined,
        projectId: String(form.get("projectId") || "") || undefined,
        environmentalFileId: environmentalFileId || undefined,
        requirementId: String(form.get("requirementId") || "") || undefined,
        visitId: String(form.get("visitId") || "") || undefined,
        name: file.name,
        fileUrl: finalFileUrl,
        fileType: file.type || "application/octet-stream",
        fileSize: fileSizeBytes,
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
  try {
    if (/pdf/i.test(file.type) || file.name.toLowerCase().endsWith(".pdf")) {
      const pdfData = await pdfParse(bytes);
      // Extraemos máximo 15,000 caracteres para no desbordar el contexto de OpenAI
      return pdfData.text.trim().slice(0, 15000) || `PDF escaneado: ${file.name}. (Requiere OCR de imágenes)`;
    }
    if (/wordprocessingml/i.test(file.type) || file.name.toLowerCase().endsWith(".docx")) {
      // Extracción rápida de texto crudo de DOCX (XML)
      const rawString = bytes.toString("utf8");
      const textMatches = rawString.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
      if (textMatches) {
        const text = textMatches.map(m => m.replace(/<[^>]+>/g, "")).join(" ");
        return text.slice(0, 15000);
      }
      return `Documento Word: ${file.name}`;
    }
    if (/text|json|csv/i.test(file.type)) {
      return bytes.toString("utf8").slice(0, 10000);
    }
  } catch (err) {
    console.error("Error extrayendo texto del documento:", err);
  }
  return `Archivo cargado: ${file.name}.`;
}

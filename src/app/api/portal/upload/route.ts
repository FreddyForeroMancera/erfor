import { requireUser } from "@/lib/auth";
import { applyExtractedProperty, extractPropertyFromText } from "@/lib/ai-extract-property";
import { extractText } from "@/lib/document-text";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Igual que en documents/upload: el OCR de documentos escaneados puede tardar varios
// segundos, por encima del límite por defecto de Vercel.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "CLIENTE_EXTERNO") {
      return Response.json({ error: "Ruta exclusiva para clientes" }, { status: 403 });
    }

    const client = await prisma.client.findFirst({ where: { email: user.email } });
    if (!client) {
      return Response.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const projectId = String(form.get("projectId") || "");
    
    if (!(file instanceof File)) return Response.json({ error: "Archivo requerido" }, { status: 400 });
    if (!projectId) return Response.json({ error: "Se requiere un proyecto" }, { status: 400 });

    // Validar que el proyecto pertenece al cliente
    const project = await prisma.project.findFirst({ where: { id: projectId, clientId: client.id } });
    if (!project) return Response.json({ error: "Proyecto no autorizado" }, { status: 403 });

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `portal/${Date.now()}-${safeName}`;
    
    const { error: uploadError } = await supabase.storage
      .from("erfor-uploads")
      .upload(`documents/${storedName}`, file, { cacheControl: '3600', upsert: false });

    if (uploadError) return Response.json({ error: "Error subiendo archivo" }, { status: 500 });

    const { data: publicUrlData } = supabase.storage
      .from("erfor-uploads")
      .getPublicUrl(`documents/${storedName}`);

    const extractedText = await extractText(file, bytes);

    const document = await prisma.document.create({
      data: {
        clientId: client.id,
        projectId: project.id,
        name: file.name,
        fileUrl: publicUrlData.publicUrl,
        fileType: file.type || "application/octet-stream",
        category: "Cargado por el Cliente",
        extractedText,
        uploadedBy: user.id,
        source: "PORTAL"
      }
    });

    // A diferencia de la carga interna, aquí se intenta la extracción con IA en
    // CUALQUIER documento que suba el cliente (sin filtro de palabras clave en el
    // nombre): el volumen por cliente es bajo y la idea es que la plataforma defina
    // los datos automáticamente sin que el cliente tenga que nombrar el archivo de
    // una forma particular. Nunca bloquea la respuesta si falla.
    let propertyExtraction = null;
    try {
      const expediente = await prisma.environmentalFile.findFirst({
        where: { projectId: project.id, propertyId: null }
      });
      if (expediente) {
        const extracted = await extractPropertyFromText(extractedText);
        if (extracted?.name) {
          propertyExtraction = await applyExtractedProperty(expediente, extracted);
        }
      }
    } catch (err) {
      console.error("Error en extracción automática de predio (portal):", err);
    }

    return ok({ document, propertyExtraction }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

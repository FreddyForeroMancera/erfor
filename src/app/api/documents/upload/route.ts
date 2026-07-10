import { requireUser } from "@/lib/auth";
import { createRequirementAutomation } from "@/lib/automations";
import { applyExtractedProperty, extractPropertyFromText } from "@/lib/ai-extract-property";
import { extractText, extractKmlGeoData } from "@/lib/document-text";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// El OCR de documentos escaneados (Tesseract + rasterizado con @napi-rs/canvas) puede
// tardar varios segundos; el límite por defecto de Vercel (10s Hobby / 15s Pro) no alcanza.
export const maxDuration = 60;

const KEY_DOCUMENT_KEYWORDS = ["auto", "resolucion", "resolución", "concepto", "requerimiento", "indagacion", "indagación"];

type IncomingFile = {
  fileName: string;
  fileType: string;
  fileSize: number;
  bytes: Buffer;
  asFile: File;
};

/**
 * Acepta dos formas de recibir el archivo:
 * 1. FormData con `file` (subida directa al handler) - la ruta clásica, sigue funcionando
 *    para archivos chicos, pero choca con el límite de 4.5 MB de Vercel en archivos grandes.
 * 2. JSON con `{ storagePath }` - el archivo YA fue subido directo a Supabase Storage desde
 *    el navegador vía URL firmada (/api/documents/upload-url), sin pasar por Vercel. Aquí
 *    solo se descarga de Storage (mismo proceso, sin límite de body entrante) para analizarlo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readIncomingFile(request: Request, supabase: any): Promise<
  | { mode: "direct"; file: IncomingFile; storagePath: string; formFields: FormData }
  | { mode: "already-uploaded"; file: IncomingFile; storagePath: string; formFields: URLSearchParams }
> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    const storagePath = String(body.storagePath || "");
    if (!storagePath) throw new Response(JSON.stringify({ error: "storagePath requerido" }), { status: 400 });

    const { data, error } = await supabase.storage.from("erfor-uploads").download(storagePath);
    if (error || !data) {
      console.error("Error descargando archivo ya subido:", error);
      throw new Response(JSON.stringify({ error: "No se pudo leer el archivo subido" }), { status: 500 });
    }
    const arrayBuffer = await data.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    const fileName = String(body.fileName || storagePath.split("/").pop() || "archivo");
    const fileType = String(body.fileType || data.type || "application/octet-stream");
    const asFile = new File([bytes], fileName, { type: fileType });

    const formFields = new URLSearchParams();
    for (const key of ["environmentalFileId", "clientId", "projectId", "requirementId", "visitId", "category", "tags"]) {
      if (body[key]) formFields.set(key, String(body[key]));
    }

    return { mode: "already-uploaded", file: { fileName, fileType, fileSize: bytes.length, bytes, asFile }, storagePath, formFields };
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new Response(JSON.stringify({ error: "Archivo requerido" }), { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `documents/${Date.now()}-${safeName}`;
  return {
    mode: "direct",
    file: { fileName: file.name, fileType: file.type, fileSize: file.size, bytes, asFile: file },
    storagePath,
    formFields: form
  };
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    // Inicializar cliente Supabase dentro del handler para evitar errores en build time
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: "Supabase no está configurado en las variables de entorno." }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const incoming = await readIncomingFile(request, supabase);
    const { fileName, fileType, fileSize, bytes, asFile: file } = incoming.file;
    const getField = (key: string) =>
      incoming.formFields instanceof FormData
        ? String(incoming.formFields.get(key) || "")
        : incoming.formFields.get(key) || "";

    // 1. Evitar duplicados: Verificar si ya existe un documento con ese nombre en ese expediente
    const environmentalFileId = getField("environmentalFileId");
    if (environmentalFileId) {
      const existingDoc = await prisma.document.findFirst({
        where: {
          name: fileName,
          environmentalFileId: environmentalFileId
        }
      });

      if (existingDoc) {
        // Permitir sobreescribir si es un documento "mock" subido en carga masiva (sin texto y url falsa)
        const isMock = existingDoc.fileUrl.startsWith("/uploads/") && !existingDoc.extractedText;
        if (!isMock) {
          return Response.json({ error: "Este documento ya fue subido y analizado previamente." }, { status: 400 });
        } else {
          // Si es mock, lo eliminaremos para reemplazarlo
          await prisma.document.delete({ where: { id: existingDoc.id } });
        }
      }
    }

    let storagePath = incoming.storagePath;

    if (incoming.mode === "direct") {
      // Subida clásica: aún no está en Supabase Storage, hay que subirla ahora.
      const { error: uploadError } = await supabase.storage
        .from("erfor-uploads")
        .upload(storagePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Supabase Upload Error:", uploadError);
        return Response.json({ error: "Error subiendo archivo a Supabase Storage" }, { status: 500 });
      }
    }
    // Si mode === "already-uploaded", el archivo ya está en Storage (subido directo desde
    // el navegador vía URL firmada) - no hay nada que subir aquí.

    const { data: publicUrlData } = supabase.storage.from("erfor-uploads").getPublicUrl(storagePath);

    // Extraer texto (Análisis con IA u OCR)
    const extractedText = await extractText(file, bytes);

    // Calcular cuota de almacenamiento actual (Límite sugerido: 900 MB)
    const quotaThresholdBytes = 900 * 1024 * 1024; // 900 MB
    const fileSizeBytes = fileSize;

    const usageResult = await prisma.document.aggregate({
      _sum: { fileSize: true },
      where: { fileUrl: { not: "PURGED" } }
    });
    const currentUsageBytes = usageResult._sum.fileSize || 0;
    const willExceedQuota = (currentUsageBytes + fileSizeBytes) > quotaThresholdBytes;

    let finalFileUrl = publicUrlData.publicUrl;

    if (willExceedQuota) {
      // BORRAR EL ARCHIVO FÍSICO DE SUPABASE PARA AHORRAR ESPACIO
      const { error: deleteError } = await supabase.storage.from("erfor-uploads").remove([storagePath]);

      if (deleteError) {
        console.error("No se pudo purgar el archivo físico de Supabase:", deleteError);
      }
      finalFileUrl = "PURGED"; // Marcamos que el archivo físico fue eliminado
    }

    // Guardar metadata en la base de datos
    const document = await prisma.document.create({
      data: {
        clientId: getField("clientId") || undefined,
        projectId: getField("projectId") || undefined,
        environmentalFileId: environmentalFileId || undefined,
        requirementId: getField("requirementId") || undefined,
        visitId: getField("visitId") || undefined,
        name: fileName,
        fileUrl: finalFileUrl,
        fileType: fileType || "application/octet-stream",
        fileSize: fileSizeBytes,
        category: getField("category") || "Documento ambiental",
        extractedText,
        tags: getField("tags"),
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

    // Extracción automática de datos del predio/cliente (IA) para documentos clave
    // (auto, resolución, concepto, requerimiento, indagación) O documentos de Office
    // (Word/Excel, que suelen traer formatos de solicitud con el nombre del predio) de un
    // expediente que aún no tiene predio asociado. Nunca bloquea la respuesta si falla.
    let propertyExtraction = null;
    const nameLower = file.name.toLowerCase();
    const isKeyDocument = KEY_DOCUMENT_KEYWORDS.some((k) => nameLower.includes(k));
    const isOfficeDocument = /\.(docx?|xlsx?)$/.test(nameLower);
    const isGeoDocument = /\.(kml|kmz)$/.test(nameLower);
    if (document.environmentalFileId && (isKeyDocument || isOfficeDocument)) {
      try {
        const expediente = await prisma.environmentalFile.findUnique({
          where: { id: document.environmentalFileId }
        });
        if (expediente && !expediente.propertyId) {
          const extracted = await extractPropertyFromText(extractedText);
          if (extracted?.name) {
            propertyExtraction = await applyExtractedProperty(expediente, extracted);
          }
        }
      } catch (err) {
        console.error("Error en extracción automática de predio:", err);
      }
    }

    // KML/KMZ: nombre + coordenadas se extraen por parseo directo del XML, sin pasar por
    // la IA (no dependen de la cuota gratuita de Gemini/OpenAI, y son datos estructurados
    // que no conviene dejar a interpretación de un modelo de lenguaje).
    if (document.environmentalFileId && isGeoDocument) {
      try {
        const expediente = await prisma.environmentalFile.findUnique({
          where: { id: document.environmentalFileId }
        });
        if (expediente && !expediente.propertyId) {
          const geoData = await extractKmlGeoData(file, bytes);
          if (geoData.name) {
            propertyExtraction = await applyExtractedProperty(expediente, geoData);
          }
        }
      } catch (err) {
        console.error("Error extrayendo geodatos de KML/KMZ:", err);
      }
    }

    return ok({ document, automation, propertyExtraction }, { status: 201 });
  } catch (error) {
    // Log explícito: fail() mete el mensaje en el body pero NO lo escribe al log, así
    // que en Vercel el 500 aparecía como "(no message)" y era indiagnosticable.
    const err = error as Error;
    console.error(
      "[documents/upload] FALLO:",
      err?.name,
      "|",
      err?.message,
      "\nSTACK:",
      err?.stack
    );
    return fail(error);
  }
}

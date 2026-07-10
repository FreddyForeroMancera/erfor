"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Sube un archivo DIRECTO desde el navegador a Supabase Storage, sin pasar por el body de
 * una función serverless de Vercel (que tiene un límite duro de 4.5 MB sin importar
 * maxDuration). Los PDF escaneados grandes chocaban con un 413 antes de llegar siquiera al
 * handler de /api/documents/upload.
 *
 * Flujo: 1) pide una URL de subida firmada al servidor (con la service-role key, segura,
 * nunca sale del backend) -> 2) sube el archivo directo a Storage con esa URL usando el
 * cliente público (clave anon, segura de exponer) -> 3) avisa al servidor que ya está
 * subido para que lo descargue, lo analice y cree el Document.
 */
export async function uploadFileDirect(
  file: File,
  fields: Record<string, string | undefined>,
  fileNameOverride?: string
): Promise<{ document: any; automation: any; propertyExtraction: any }> {
  // En la carga masiva (input con webkitdirectory), file.name puede venir con la ruta
  // relativa completa en vez del nombre base; el llamador pasa el nombre correcto ya
  // aislado (mismo criterio que se usaba antes con el 3er argumento de FormData.append).
  const fileName = fileNameOverride || file.name;

  const urlRes = await fetch("/api/documents/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName })
  });
  const urlData = await urlRes.json();
  if (!urlRes.ok) throw new Error(urlData?.error || "No se pudo preparar la subida");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase no está configurado en el navegador (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY).");
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // supabase-js sube un File dentro de un FormData; el navegador arma un header
  // Content-Disposition con file.name para esa parte del multipart, y revienta con
  // "String contains non ISO-8859-1 code point" si el nombre real trae tildes/ñ (común en
  // documentos legales en español). El path de Storage ya va sanitizado por el servidor;
  // aquí se envuelve el mismo archivo con un nombre ASCII-only solo para esta llamada — el
  // nombre real y original se preserva aparte, en el JSON del paso de finalización.
  const safeUploadName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileForUpload = new File([file], safeUploadName, { type: file.type });

  const { error: uploadError } = await supabase.storage
    .from("erfor-uploads")
    .uploadToSignedUrl(urlData.path, urlData.token, fileForUpload);
  if (uploadError) throw new Error(`Error subiendo el archivo: ${uploadError.message}`);

  const finalizeRes = await fetch("/api/documents/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      storagePath: urlData.path,
      fileName,
      fileType: file.type,
      fileSize: file.size,
      ...fields
    })
  });
  const finalizeData = await finalizeRes.json();
  if (!finalizeRes.ok) throw new Error(finalizeData?.error || "Error al procesar el documento subido");

  return finalizeData;
}

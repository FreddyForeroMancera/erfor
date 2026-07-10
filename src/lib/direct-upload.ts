"use client";


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

  try {
    // Para archivos grandes en producción, el cliente de Supabase (storage-js) puede fallar
    // internamente al manipular cabeceras nativas (Headers Constructor) arrojando:
    // "Failed to execute 'set' on 'Headers': String contains non ISO-8859-1 code point."
    // Para evitarlo por completo, hacemos la subida mediante un fetch PUT directo/nativo
    // a la URL firmada.
    const fileArrayBuffer = await file.arrayBuffer();
    const uploadRes = await fetch(urlData.signedUrl, {
      method: "PUT",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "cache-control": "max-age=3600",
        "x-upsert": "false"
      },
      body: fileArrayBuffer
    });

    if (!uploadRes.ok) {
      const responseText = await uploadRes.text().catch(() => "");
      throw new Error(`Código de estado HTTP ${uploadRes.status}: ${responseText || uploadRes.statusText}`);
    }
  } catch (thrown: any) {
    const detail = [thrown?.name, thrown?.message, thrown?.cause?.message]
      .filter(Boolean)
      .join(" | ");
    throw new Error(
      `Error subiendo el archivo directamente: ${detail || String(thrown)} | fileName="${fileName}" (${file.size} bytes, tipo="${file.type}")`
    );
  }

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

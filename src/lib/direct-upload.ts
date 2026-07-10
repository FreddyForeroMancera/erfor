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

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/[^\x00-\xFF]/g, "");
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim().replace(/[^\x00-\xFF]/g, "");
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase no está configurado en el navegador (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY).");
  }

  try {
    // Para archivos grandes en producción, el cliente de Supabase (storage-js) o incluso el propio
    // fetch nativo del navegador puede verse afectado por extensiones o filtros de red (antivirus, DLP)
    // que interceptan la llamada y fallan internamente al manipular cabeceras, arrojando:
    // "Failed to execute 'fetch' on 'Window': Failed to read the 'headers' property from 'RequestInit': String contains non ISO-8859-1 code point."
    // Para evitarlo y saltarnos cualquier monkeypatch o interceptor de 'fetch', usamos XMLHttpRequest directo
    // que es un API más de bajo nivel y no pasa por el mismo flujo de RequestInit de 'fetch'.
    const fileArrayBuffer = await file.arrayBuffer();
    const cleanContentType = (file.type || "application/octet-stream").trim().replace(/[^\x00-\xFF]/g, "");

    const headersConfig: Record<string, string> = {
      "apikey": supabaseAnonKey,
      "Authorization": `Bearer ${supabaseAnonKey}`,
      "Content-Type": cleanContentType,
      "cache-control": "max-age=3600",
      "x-upsert": "false"
    };

    console.log("[Diagnostic] Attempting upload via XMLHttpRequest PUT to:", urlData.signedUrl);
    console.log("[Diagnostic] Headers being passed:", { ...headersConfig });
    
    // Verificación proactiva por consola
    for (const [key, value] of Object.entries(headersConfig)) {
      for (let i = 0; i < key.length; i++) {
        if (key.charCodeAt(i) > 255) {
          console.error(`[Diagnostic] Key "${key}" has non-ISO-8859-1 character at index ${i}: code=${key.charCodeAt(i)}`);
        }
      }
      for (let i = 0; i < value.length; i++) {
        if (value.charCodeAt(i) > 255) {
          console.error(`[Diagnostic] Value for key "${key}" has non-ISO-8859-1 character at index ${i}: code=${value.charCodeAt(i)}`);
        }
      }
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", urlData.signedUrl, true);
    
    // Configurar cabeceras una a una
    for (const [key, value] of Object.entries(headersConfig)) {
      xhr.setRequestHeader(key, value);
    }

    const uploadPromise = new Promise<void>((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Código de estado HTTP ${xhr.status}: ${xhr.responseText || xhr.statusText}`));
        }
      };
      xhr.onerror = () => reject(new Error("Error de red en XMLHttpRequest"));
      xhr.onabort = () => reject(new Error("Subida abortada"));
    });

    xhr.send(fileArrayBuffer);
    await uploadPromise;
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

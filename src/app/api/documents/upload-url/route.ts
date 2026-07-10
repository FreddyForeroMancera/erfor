import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { createClient } from "@supabase/supabase-js";

/**
 * Genera una URL de subida firmada para que el navegador suba el archivo DIRECTO a
 * Supabase Storage, sin pasar por la función serverless de Vercel. Vercel limita el body
 * de cada request a 4.5 MB (Hobby/Pro) sin importar `maxDuration`; los PDF escaneados
 * grandes chocaban con un 413 "Payload Too Large" antes de siquiera llegar al handler de
 * /api/documents/upload. Con esto, el archivo nunca pasa por Vercel: el navegador sube
 * directo con esta URL firmada, y /api/documents/upload solo recibe la ruta ya subida
 * para descargarla del lado del servidor (bytes chicos, sin límite de body) y analizarla.
 */
export async function POST(request: Request) {
  try {
    await requireUser();
    const { fileName } = await request.json();
    if (!fileName || typeof fileName !== "string") {
      return Response.json({ error: "fileName requerido" }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: "Supabase no está configurado en las variables de entorno." }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `documents/${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage.from("erfor-uploads").createSignedUploadUrl(path);
    if (error || !data) {
      console.error("Error creando URL de subida firmada:", error);
      return Response.json({ error: "No se pudo preparar la subida directa" }, { status: 500 });
    }

    return ok({ path, token: data.token, signedUrl: data.signedUrl });
  } catch (error) {
    return fail(error);
  }
}

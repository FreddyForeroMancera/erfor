import fs from "node:fs/promises";
import path from "node:path";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
  const target = path.resolve(uploadRoot, ...segments);
  if (!target.startsWith(uploadRoot)) {
    return Response.json({ error: "Ruta inválida" }, { status: 400 });
  }
  try {
    const file = await fs.readFile(target);
    const extension = path.extname(target).toLowerCase();
    const contentType = extension === ".pdf" ? "application/pdf" : extension === ".png" ? "image/png" : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "application/octet-stream";
    return new Response(file, { headers: { "Content-Type": contentType } });
  } catch {
    return Response.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
}

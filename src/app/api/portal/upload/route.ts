import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

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

    const document = await prisma.document.create({
      data: {
        clientId: client.id,
        projectId: project.id,
        name: file.name,
        fileUrl: publicUrlData.publicUrl,
        fileType: file.type || "application/octet-stream",
        category: "Cargado por el Cliente",
        uploadedBy: user.id,
        source: "PORTAL"
      }
    });

    return ok({ document }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

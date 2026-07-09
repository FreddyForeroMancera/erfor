import { canWrite, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");

    const where: any = { category: "Cotización" };
    if (clientId) {
      where.clientId = clientId;
    }

    const quotes = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        createdAt: true,
      }
    });

    return ok(quotes);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!canWrite(user.role)) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Archivo requerido" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return Response.json({ error: "Solo se permiten archivos PDF" }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: "Supabase no está configurado en las variables de entorno." }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${Date.now()}-${safeName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("erfor-uploads")
      .upload(`quotes/${storedName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      return Response.json({ error: "Error subiendo cotización a Supabase Storage" }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("erfor-uploads")
      .getPublicUrl(`quotes/${storedName}`);

    const clientId = String(form.get("clientId") || "");

    const document = await prisma.document.create({
      data: {
        clientId: clientId || undefined,
        name: file.name,
        fileUrl: publicUrlData.publicUrl,
        fileType: file.type,
        category: "Cotización",
        uploadedBy: user.id,
        source: "UPLOAD"
      }
    });

    return ok(document, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

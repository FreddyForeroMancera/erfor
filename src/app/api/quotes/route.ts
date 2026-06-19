import fs from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";

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
    const form = await request.formData();
    const file = form.get("file");
    
    if (!(file instanceof File)) {
      return Response.json({ error: "Archivo requerido" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return Response.json({ error: "Solo se permiten archivos PDF" }, { status: 400 });
    }

    const uploadRoot = process.env.UPLOAD_DIR || "./uploads";
    const dir = path.resolve(process.cwd(), uploadRoot, "quotes");
    
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${Date.now()}-${safeName}`;
    await fs.writeFile(path.join(dir, storedName), bytes);

    const clientId = String(form.get("clientId") || "");

    const document = await prisma.document.create({
      data: {
        clientId: clientId || undefined,
        name: file.name,
        // Assuming uploadRoot ends up pointing to public/uploads
        fileUrl: `/uploads/quotes/${storedName}`,
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

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    // Validar permisos básicos, por ejemplo si es cliente externo no debería cambiar esto, 
    // pero por ahora lo dejamos con la validación de sesión básica.
    /*
    if (session.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No tienes permiso para cambiar el estado" }, { status: 403 });
    }
    */

    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "El estado es requerido" }, { status: 400 });
    }

    const file = await prisma.environmentalFile.update({
      where: { id: resolvedParams.id },
      data: { status }
    });
    
    // Opcional: Crear un registro en ActivityLog
    await prisma.activityLog.create({
      data: {
        action: "STATUS_CHANGED",
        entityType: "EnvironmentalFile",
        entityId: file.id,
        description: `El estado del expediente ha cambiado a ${status}.`,
        userId: session.id,
      }
    });

    return ok(file);
  } catch (error) {
    return fail(error);
  }
}

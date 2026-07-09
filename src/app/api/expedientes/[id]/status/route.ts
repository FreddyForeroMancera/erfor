import { prisma } from "@/lib/prisma";
import { requireConsultant } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { statusSchema } from "@/lib/expediente-status";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Solo el equipo interno (no CLIENTE_EXTERNO, no AUDITOR) puede cambiar el estado de un expediente.
    const session = await requireConsultant();

    const resolvedParams = await params;
    const { status } = statusSchema.parse(await request.json());

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

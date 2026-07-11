import { prisma } from "@/lib/prisma";
import { requireUser, canDelete, canWrite } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const resolvedParams = await params;
    
    const file = await prisma.environmentalFile.findUnique({
      where: { id: resolvedParams.id },
      include: {
        client: true,
        property: true,
        procedures: true,
        documents: {
          orderBy: { createdAt: "desc" }
        }
      }
    });
    
    if (!file) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }
    
    return ok(file);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (!canDelete(user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 1. Verificar si el expediente existe
    const file = await prisma.environmentalFile.findUnique({
      where: { id }
    });

    if (!file) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    // 2. Ejecutar la eliminación relacional en una transacción para evitar violaciones de claves foráneas
    await prisma.$transaction([
      // Desvincular documentos
      prisma.document.updateMany({
        where: { environmentalFileId: id },
        data: { environmentalFileId: null }
      }),
      // Desvincular trámites/procedimientos
      prisma.procedure.updateMany({
        where: { environmentalFileId: id },
        data: { environmentalFileId: null }
      }),
      // Desvincular requerimientos
      prisma.requirement.updateMany({
        where: { environmentalFileId: id },
        data: { environmentalFileId: null }
      }),
      // Desvincular visitas
      prisma.visit.updateMany({
        where: { environmentalFileId: id },
        data: { environmentalFileId: null }
      }),
      // Eliminar tareas asociadas
      prisma.task.deleteMany({
        where: { environmentalFileId: id }
      }),
      // Eliminar alertas asociadas
      prisma.alert.deleteMany({
        where: { environmentalFileId: id }
      }),
      // Eliminar conversaciones de IA asociadas (los mensajes se borran por cascade en el schema)
      prisma.aIConversation.deleteMany({
        where: { environmentalFileId: id }
      }),
      // Finalmente eliminar el expediente
      prisma.environmentalFile.delete({
        where: { id }
      })
    ]);

    // 3. Crear registro de actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        entityType: "environmentalFiles",
        entityId: id,
        description: `Eliminó el expediente: "${file.internalCode}"`
      }
    });

    return ok({ message: "Expediente eliminado con éxito" });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (!canWrite(user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await request.json();

    // 1. Si se proporciona newProjectName, creamos el proyecto primero
    let projectId = data.projectId;
    if (!projectId && data.newProjectName?.trim()) {
      const file = await prisma.environmentalFile.findUnique({ where: { id } });
      if (file) {
        const project = await prisma.project.create({
          data: {
            clientId: file.clientId,
            name: data.newProjectName.trim(),
            type: "Cotización Ambiental", 
            status: "PREPARATION",
            riskLevel: "MEDIUM"
          }
        });
        projectId = project.id;
      }
    }

    // 2. Actualizamos el expediente
    const updatedFile = await prisma.environmentalFile.update({
      where: { id },
      data: {
        internalCode: data.internalCode,
        officialCode: data.officialCode,
        authority: data.authority,
        carRegional: data.carRegional,
        type: data.type,
        priority: data.priority,
        riskLevel: data.riskLevel,
        openedAt: data.openedAt ? new Date(data.openedAt) : null,
        filedAt: data.filedAt ? new Date(data.filedAt) : null,
        nextDeadline: data.nextDeadline ? new Date(data.nextDeadline) : null,
        description: data.description,
        timeline: data.timeline,
        status: data.status,
        projectId: projectId === "NONE" ? null : (projectId || undefined)
      }
    });

    // 3. Crear registro de actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        entityType: "environmentalFiles",
        entityId: id,
        description: `Actualizó el expediente/cotización: "${updatedFile.internalCode}"`
      }
    });

    return ok(updatedFile);
  } catch (error) {
    return fail(error);
  }
}

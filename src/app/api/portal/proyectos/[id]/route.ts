import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await requireUser();
    
    if (user.role !== "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "Acceso exclusivo para clientes" }, { status: 403 });
    }

    const client = await prisma.client.findFirst({
      where: { email: user.email }
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const projectId = resolvedParams.id;

    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        clientId: client.id // Security Check
      },
      include: {
        procedures: {
          orderBy: { updatedAt: 'desc' }
        },
        obligations: {
          orderBy: { dueDate: 'asc' }
        },
        documents: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: 'desc' }
        },
        responsible: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado o no tienes acceso" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    return fail(error);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clientId = resolvedParams.id;
    const body = await request.json();

    const { name, documentType, documentNumber, email, phone, address, city, department, representative, notes, priority } = body;

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(name !== undefined && { name }),
        ...(documentType !== undefined && { documentType }),
        ...(documentNumber !== undefined && { documentNumber }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(department !== undefined && { department }),
        ...(representative !== undefined && { representative }),
        ...(notes !== undefined && { notes }),
        ...(priority !== undefined && { priority }),
      }
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clientId = resolvedParams.id;
    const client = await prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Suspend client (logical delete)
    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientId },
        data: { status: "INACTIVE" }
      });
      
      // Also suspend the user linked to this client email
      if (client.email) {
        await tx.user.updateMany({
          where: { email: client.email },
          data: { status: "INACTIVE" }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error inactivando cliente:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clientId = resolvedParams.id;
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        _count: {
          select: {
            projects: true,
            files: true
          }
        },
        projects: {
          orderBy: { createdAt: "desc" }
        },
        properties: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

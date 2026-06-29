import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clientId = params.id;
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

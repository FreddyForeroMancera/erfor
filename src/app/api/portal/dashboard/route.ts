import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    
    if (user.role !== "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "Acceso exclusivo para clientes" }, { status: 403 });
    }

    const client = await prisma.client.findFirst({
      where: { email: user.email }
    });

    if (!client) {
      return NextResponse.json({ projects: [], alerts: [] });
    }

    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      include: {
        procedures: true,
        obligations: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const alerts = await prisma.alert.findMany({
      where: { clientId: client.id, status: "OPEN" },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    return NextResponse.json({ projects, alerts });
  } catch (error) {
    return fail(error);
  }
}

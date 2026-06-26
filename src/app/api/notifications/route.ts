import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const whereClause: any = { status: "OPEN" };
    if (clientId) {
      whereClause.clientId = clientId;
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      orderBy: { dueDate: "asc" },
      take: 10,
      include: {
        environmentalFile: {
          select: {
            id: true,
            officialCode: true,
            internalCode: true,
          }
        }
      }
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Error fetching notifications" }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
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

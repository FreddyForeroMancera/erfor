import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const resolvedParams = await params;
    
    const file = await prisma.environmentalFile.findUnique({
      where: { id: resolvedParams.id },
      include: {
        client: true,
        property: true,
        procedures: true
      }
    });
    
    if (!file) {
      throw new Error("Expediente no encontrado");
    }
    
    return ok(file);
  } catch (error) {
    return fail(error);
  }
}

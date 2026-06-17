import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");
    
    const where = clientId ? { clientId } : {};
    
    const items = await prisma.environmentalFile.findMany({
      where,
      include: {
        client: { select: { name: true } },
        property: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    
    return ok({ items, total: items.length });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = await request.json();
    
    if (!data.clientId || !data.internalCode || !data.authority || !data.type) {
      throw new Error("Faltan campos obligatorios");
    }

    const newItem = await prisma.environmentalFile.create({
      data: {
        clientId: data.clientId,
        internalCode: data.internalCode,
        authority: data.authority,
        carRegional: data.carRegional,
        type: data.type,
        status: "PREPARATION",
        responsibleUserId: user.id
      }
    });

    return ok(newItem);
  } catch (error) {
    return fail(error);
  }
}

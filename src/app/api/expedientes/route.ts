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
    
    if (!data.internalCode || !data.authority || !data.type) {
      throw new Error("Faltan campos obligatorios para el Expediente");
    }

    let clientId = data.clientId;
    if (!clientId) {
      if (!data.clientName) throw new Error("Se requiere el nombre del cliente o seleccionar uno existente");
      const client = await prisma.client.create({
        data: {
          name: data.clientName,
          type: "EMPRESA", // Default for now
          documentType: "NIT",
          documentNumber: data.clientDocument,
          address: data.clientAddress,
          phone: data.clientPhone,
          status: "ACTIVE",
          priority: "MEDIUM"
        }
      });
      clientId = client.id;
    }

    let propertyId = data.propertyId;
    if (!propertyId && data.propertyName) {
      const property = await prisma.property.create({
        data: {
          clientId,
          name: data.propertyName,
          cadastralCode: data.propertyCadastral,
          realEstateRegistration: data.propertyRegistration
        }
      });
      propertyId = property.id;
    }

    const newItem = await prisma.environmentalFile.create({
      data: {
        clientId,
        propertyId,
        internalCode: data.internalCode,
        authority: data.authority,
        carRegional: data.carRegional,
        type: data.type,
        status: "PREPARATION",
        responsibleUserId: user.id
      }
    });

    if (data.procedures && Array.isArray(data.procedures) && data.procedures.length > 0) {
      for (const procName of data.procedures) {
        await prisma.procedure.create({
          data: {
            clientId,
            environmentalFileId: newItem.id,
            type: procName,
            authority: data.authority,
            status: "DRAFT",
            riskLevel: "MEDIUM"
          }
        });
      }
    }

    return ok(newItem);
  } catch (error) {
    return fail(error);
  }
}

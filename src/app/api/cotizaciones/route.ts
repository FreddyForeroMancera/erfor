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
        project: { select: { name: true } }
      },
      orderBy: { updatedAt: "desc" }
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
          type: data.clientType || "JURIDICA",
          documentType: data.clientDocumentType || "NIT",
          documentNumber: data.clientDocument,
          email: data.clientEmail,
          address: data.clientAddress,
          phone: data.clientPhone,
          status: "ACTIVE",
          priority: "MEDIUM"
        }
      });
      clientId = client.id;
    }

    let projectId = data.projectId;
    if (!projectId && data.projectName) {
      const project = await prisma.project.create({
        data: {
          clientId,
          name: data.projectName,
          type: "Cotización Ambiental", 
          status: "PREPARATION",
          riskLevel: "MEDIUM"
        }
      });
      projectId = project.id;
    }

    let propertyId = data.propertyId;
    if (!propertyId && data.propertyName) {
      const property = await prisma.property.create({
        data: {
          clientId,
          name: data.propertyName,
          cadastralCode: data.propertyCadastral,
          realEstateRegistration: data.propertyRegistration,
          city: data.propertyCity,
          village: data.propertyVillage,
          area: data.propertyArea,
          owner: data.propertyAdminName,
          notes: data.propertyAdminPhone ? `Teléfono del administrador: ${data.propertyAdminPhone}` : undefined
        }
      });
      propertyId = property.id;
    }

    const newItem = await prisma.environmentalFile.create({
      data: {
        clientId,
        projectId,
        propertyId,
        internalCode: data.internalCode,
        authority: data.authority,
        carRegional: data.carRegional,
        type: data.type,
        status: "DRAFT", // Start in DRAFT phase for "Cotizaciones"
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

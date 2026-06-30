import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, readJson } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";

const createExpedienteSchema = z.object({
  // Expediente
  expedienteCode: z.string().min(1),
  authority: z.string().min(1),
  regional: z.string().optional(),
  expedienteType: z.string().optional(),
  
  // Client
  clientName: z.string().min(2),
  identification: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  
  // Property
  propertyName: z.string().optional(),
  cadastralCode: z.string().optional(),
  realEstateRegistration: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ items: clients });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await readJson(request);
    const data = createExpedienteSchema.parse(body);

    // Run in transaction to ensure Client, Property, Project and Expediente are created together
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Create Client
      const newClient = await tx.client.create({
        data: {
          name: data.clientName,
          type: "Empresa",
          documentType: "NIT/CC",
          documentNumber: data.identification,
          address: data.address,
          phone: data.phone,
          status: "ACTIVE",
          priority: "MEDIUM"
        }
      });

      // 2. Create default Property (Finca/Predio)
      const newProperty = await tx.property.create({
        data: {
          clientId: newClient.id,
          name: data.propertyName || "Finca Principal",
          cadastralCode: data.cadastralCode,
          realEstateRegistration: data.realEstateRegistration,
        }
      });

      // 3. Create default Project (Cotización)
      const newProject = await tx.project.create({
        data: {
          clientId: newClient.id,
          name: "Proyecto Inicial",
          type: data.expedienteType || "Licencia Ambiental",
          environmentalAuthority: data.authority,
          status: "PREPARATION",
        }
      });

      // 4. Create Environmental File (Expediente)
      const newExpediente = await tx.environmentalFile.create({
        data: {
          clientId: newClient.id,
          projectId: newProject.id,
          propertyId: newProperty.id,
          internalCode: data.expedienteCode,
          authority: data.authority,
          carRegional: data.regional,
          type: data.expedienteType || "Permisivo",
          status: "PREPARATION",
        }
      });

      // Connect Property to Project just in case
      await tx.property.update({
        where: { id: newProperty.id },
        data: { projectId: newProject.id }
      });

      return { client: newClient, expediente: newExpediente };
    });

    return NextResponse.json({ 
      success: true, 
      client: result.client,
      expediente: result.expediente
    });
  } catch (error) {
    return fail(error);
  }
}

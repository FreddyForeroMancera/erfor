import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { clients } = await req.json();

    if (!clients || !Array.isArray(clients)) {
      return NextResponse.json({ error: "Estructura de datos inválida" }, { status: 400 });
    }

    // Process all imports inside a transaction (or handle individually if they are too many)
    // To avoid transaction timeout on large uploads, we iterate sequentially.
    
    const results = { clientsCreated: 0, expedientesCreated: 0, documentsCreated: 0 };

    for (const parsedClient of clients) {
      // 1. Upsert Client
      let client = await prisma.client.findFirst({
        where: { name: parsedClient.name }
      });

      if (!client) {
        client = await prisma.client.create({
          data: {
            name: parsedClient.name,
            type: "Empresa", // default
            status: "ACTIVE"
          }
        });
        results.clientsCreated++;
      }

      // 2. Process Expedientes
      for (const parsedExp of parsedClient.expedientes) {
        let expediente = await prisma.environmentalFile.findFirst({
          where: { 
            internalCode: parsedExp.internalCode,
            clientId: client.id
          }
        });

        if (!expediente) {
          expediente = await prisma.environmentalFile.create({
            data: {
              internalCode: parsedExp.internalCode,
              authority: "CAR", // default or inferred
              type: "Desconocido",
              status: "PREPARATION", // Can be adjusted by analyzing the folder structure
              clientId: client.id,
            }
          });
          results.expedientesCreated++;
        }

        // 3. Process Documents
        for (const parsedDoc of parsedExp.documents) {
          // Check if document already exists by name and expediente
          const existingDoc = await prisma.document.findFirst({
            where: {
              name: parsedDoc.name,
              environmentalFileId: expediente.id
            }
          });

          // Infer status from folder name if possible (heuristic)
          const folderStatus = parsedDoc.statusFolder.toUpperCase();
          let workStatus = "PREPARATION";
          if (folderStatus.includes("TRAMITE")) workStatus = "EVALUATION";
          if (folderStatus.includes("OTORGADO")) workStatus = "APPROVED";
          if (folderStatus.includes("ARCHIVADO")) workStatus = "ARCHIVED";

          // Optional: Update expediente status if we found a more advanced status folder
          if (workStatus !== "PREPARATION" && expediente.status === "PREPARATION") {
            await prisma.environmentalFile.update({
              where: { id: expediente.id },
              data: { status: workStatus as any }
            });
          }

          if (!existingDoc) {
            await prisma.document.create({
              data: {
                name: parsedDoc.name,
                fileUrl: `/uploads/${parsedDoc.path}`, // Mock URL for now
                fileType: parsedDoc.name.split('.').pop() || "unknown",
                category: parsedDoc.statusFolder || "General",
                status: "ACTIVE",
                clientId: client.id,
                environmentalFileId: expediente.id,
              }
            });
            results.documentsCreated++;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Importación masiva completada",
      results 
    });

  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 });
  }
}

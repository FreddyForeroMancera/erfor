import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { applyExtractedProperty, parseClientDataCsv } from "@/lib/ai-extract-property";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { clients } = await req.json();

    if (!clients || !Array.isArray(clients)) {
      return NextResponse.json({ error: "Estructura de datos inválida" }, { status: 400 });
    }

    // Process all imports inside a transaction (or handle individually if they are too many)
    // To avoid transaction timeout on large uploads, we iterate sequentially.
    
    const results = { clientsCreated: 0, expedientesCreated: 0, documentsCreated: 0 };
    const tree: any[] = [];

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
      
      const clientNode: any = {
        id: client.id,
        name: client.name,
        expedientes: []
      };

      // 1b. Datos preestablecidos (datos.csv en la carpeta del cliente) - tienen
      // prioridad sobre lo que la IA extraiga después de los documentos: se aplican
      // aquí mismo, antes de procesar ningún documento, y applyExtractedProperty ya
      // respeta la regla de "solo llenar campos vacíos" para lo que venga más tarde.
      const csvRowsByExpediente = parseClientDataCsv(parsedClient.datosCsv);

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

        const csvRow = csvRowsByExpediente.get(parsedExp.internalCode);
        if (csvRow) {
          try {
            await applyExtractedProperty(expediente, csvRow);
          } catch (err) {
            console.error(`Error aplicando datos.csv al expediente ${parsedExp.internalCode}:`, err);
          }
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
        
        // Add to tree
        clientNode.expedientes.push({
          id: expediente.id,
          internalCode: expediente.internalCode,
          documents: parsedExp.documents.map((d: any) => ({ name: d.name }))
        });
      }
      
      tree.push(clientNode);
    }

    return NextResponse.json({ 
      message: "Importación completada", 
      results,
      tree 
    });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 });
  }
}

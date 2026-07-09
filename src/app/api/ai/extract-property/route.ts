import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { selectKeyDocument, extractPropertyFromText } from "@/lib/ai-extract-property";
const pdfParse = require("pdf-parse");

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { environmentalFileId } = await req.json();

    if (!environmentalFileId) {
      return NextResponse.json({ error: "environmentalFileId is required" }, { status: 400 });
    }

    const expediente = await prisma.environmentalFile.findUnique({
      where: { id: environmentalFileId },
      include: {
        documents: true,
        property: true,
        client: true
      }
    });

    if (!expediente) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    // Si ya tiene predio, no hacemos nada a menos que se quiera forzar
    if (expediente.propertyId) {
      return NextResponse.json({ 
        message: "El expediente ya tiene un predio asociado",
        property: expediente.property 
      });
    }

    const keyDoc = selectKeyDocument(expediente.documents);
    if (!keyDoc) {
      return NextResponse.json({ error: "No hay documentos en este expediente para analizar" }, { status: 400 });
    }

    let textToAnalyze = keyDoc.extractedText;

    // Si no hay texto extraído pero hay una URL pública real de Supabase
    if (!textToAnalyze && keyDoc.fileUrl && keyDoc.fileUrl.startsWith("http")) {
      try {
        const fileRes = await fetch(keyDoc.fileUrl);
        if (fileRes.ok) {
          const buffer = Buffer.from(await fileRes.arrayBuffer());
          const pdfData = await pdfParse(buffer);
          textToAnalyze = pdfData.text;
          
          // Guardar el texto extraído para futuras consultas
          await prisma.document.update({
            where: { id: keyDoc.id },
            data: { extractedText: textToAnalyze.slice(0, 15000) }
          });
        }
      } catch (e) {
        console.error("Error downloading or parsing PDF:", e);
      }
    }

    if (!textToAnalyze || textToAnalyze.trim() === "") {
      return NextResponse.json({ error: "No se pudo extraer texto del documento principal." }, { status: 400 });
    }

    const extractedData = await extractPropertyFromText(textToAnalyze);

    if (!extractedData || !extractedData.name) {
      return NextResponse.json({ message: "La IA no encontró información de un predio en el documento." }, { status: 200 });
    }

    // 1. Buscar si ya existe un predio con ese nombre para este cliente
    let property = await prisma.property.findFirst({
      where: {
        clientId: expediente.clientId,
        name: extractedData.name
      }
    });

    // 2. Si no existe, crearlo
    if (!property) {
      property = await prisma.property.create({
        data: {
          clientId: expediente.clientId,
          name: extractedData.name,
          cadastralCode: extractedData.cadastralCode || null,
          realEstateRegistration: extractedData.realEstateRegistration || null,
          city: extractedData.city || null,
          village: extractedData.village || null,
          owner: extractedData.owner || null,
        }
      });
    }

    // 3. Enlazar el expediente al predio y actualizar tipo
    const updateData: any = {
      propertyId: property.id
    };

    if (extractedData.type && expediente.type === "Desconocido") {
      updateData.type = extractedData.type;
    }

    await prisma.environmentalFile.update({
      where: { id: expediente.id },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      property,
      updatedType: updateData.type || null
    });

  } catch (error: any) {
    console.error("Error en extract-property:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}

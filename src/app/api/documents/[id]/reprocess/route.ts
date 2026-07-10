import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConsultant } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { extractText } from "@/lib/document-text";
import { applyExtractedProperty, extractPropertyFromText } from "@/lib/ai-extract-property";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireConsultant();
    const { id } = await params;

    // 1. Cargar el documento de la base de datos
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        environmentalFile: {
          include: {
            property: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // Omitir si es un archivo purgado o local/mock
    if (!document.fileUrl || document.fileUrl === "PURGED" || document.fileUrl.startsWith("/uploads/")) {
      return NextResponse.json({
        error: "El archivo no se encuentra físicamente en el almacenamiento de producción (PURGED o local mock)"
      }, { status: 400 });
    }

    // 2. Extraer path del storage desde la url pública
    // Ejemplo de URL: https://[host]/storage/v1/object/public/erfor-uploads/documents/1783-file.pdf
    const urlParts = document.fileUrl.split("/erfor-uploads/");
    if (urlParts.length < 2) {
      return NextResponse.json({ error: "URL de archivo con formato no compatible con Supabase Storage" }, { status: 400 });
    }
    const storagePath = decodeURIComponent(urlParts[1]);

    // 3. Inicializar cliente de Supabase
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase no está configurado en las variables de entorno." }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Descargar bytes de Storage
    const { data, error: downloadError } = await supabase.storage.from("erfor-uploads").download(storagePath);
    if (downloadError || !data) {
      console.error("Error descargando de Supabase para reprocesamiento:", downloadError);
      return NextResponse.json({ error: `Error descargando el archivo desde el bucket: ${downloadError?.message || 'Archivo no encontrado'}` }, { status: 500 });
    }

    const arrayBuffer = await data.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);

    // 5. Extraer texto usando nuestro pipeline de extracción (incluye OCR en PDFs escaneados)
    const mockFile = new File([bytes], document.name, { type: document.fileType });
    const extractedText = await extractText(mockFile, bytes);

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "No se pudo extraer texto del documento." }, { status: 400 });
    }

    // 6. Actualizar el documento en la base de datos
    const updatedDoc = await prisma.document.update({
      where: { id: document.id },
      data: { extractedText }
    });

    // 7. Si no tiene predio asociado el expediente padre, intentar extraer y asociar predio
    let propertyExtraction = null;
    if (document.environmentalFileId && (!document.environmentalFile || !document.environmentalFile.propertyId)) {
      try {
        const expediente = await prisma.environmentalFile.findUnique({
          where: { id: document.environmentalFileId }
        });
        if (expediente && !expediente.propertyId) {
          const extracted = await extractPropertyFromText(extractedText);
          if (extracted?.name) {
            propertyExtraction = await applyExtractedProperty(expediente, extracted);
          }
        }
      } catch (err) {
        console.error("Error en extracción retroactiva de predio:", err);
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: updatedDoc.id,
        name: updatedDoc.name,
        extractedTextLen: extractedText.length
      },
      propertyExtraction
    });

  } catch (error: any) {
    console.error("Error en endpoint de reprocesamiento:", error);
    return NextResponse.json({ error: error?.message || "Error interno de servidor" }, { status: 500 });
  }
}

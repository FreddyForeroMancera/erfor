import { prisma } from "@/lib/prisma";
import { requireConsultant } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { applyExtractedProperty, extractPropertyFromText } from "@/lib/ai-extract-property";

export const maxDuration = 60;

const MAX_TEXT = 15000;

/**
 * Re-analiza un expediente usando el texto ya extraído de sus documentos (los que ya
 * están en Supabase), sin necesidad de volver a subir archivos. Sirve para llenar
 * predio/propietario/representante cuando la extracción automática no lo logró en la carga
 * (por ejemplo cuando el nombre del predio estaba en un Word/Excel que sí se subió después).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireConsultant();
    const { id } = await params;

    const expediente = await prisma.environmentalFile.findUnique({
      where: { id },
      include: { documents: { select: { name: true, extractedText: true, fileUrl: true } } }
    });
    if (!expediente) {
      return Response.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    // Solo texto realmente analizable: documentos ya subidos a Supabase (URL real) con
    // texto útil, descartando los marcadores de respaldo ("Archivo cargado:" / "PDF
    // escaneado:") y los registros mock de la carga masiva (URL /uploads/...).
    const usableTexts = expediente.documents
      .filter((d) =>
        d.extractedText &&
        d.extractedText.trim().length > 80 &&
        !d.extractedText.startsWith("Archivo cargado:") &&
        !d.extractedText.startsWith("PDF escaneado:") &&
        !d.fileUrl.startsWith("/uploads/")
      )
      .map((d) => d.extractedText as string);

    if (usableTexts.length === 0) {
      return ok({
        property: null,
        analyzedDocuments: 0,
        message:
          "No hay documentos con texto analizable en este expediente. Sube al menos un PDF con texto, Word o Excel y vuelve a intentar."
      });
    }

    // Combinar el texto de varios documentos en un solo prompt (una sola llamada a la IA),
    // capado al límite del prompt.
    let combined = "";
    for (const text of usableTexts) {
      combined += `${text}\n\n`;
      if (combined.length >= MAX_TEXT) break;
    }

    const extracted = await extractPropertyFromText(combined);
    let property = null;
    if (extracted?.name) {
      const result = await applyExtractedProperty(expediente, extracted);
      property = result?.property || null;
    }

    return ok({
      property,
      analyzedDocuments: usableTexts.length,
      extracted: extracted || null
    });
  } catch (error) {
    return fail(error);
  }
}

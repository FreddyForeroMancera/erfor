import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { extractTextWithOcr } from "@/lib/ocr";

const MAX_CHARS = 15000;

/**
 * Extrae el mejor texto disponible de un archivo subido (PDF con o sin capa de texto,
 * DOCX, XLSX/XLS, texto plano) para alimentar el prompt de extracción con IA. Usado
 * tanto por la carga interna (documents/upload) como por el portal de clientes
 * (portal/upload), para que ambos flujos analicen el contenido igual.
 */
export async function extractText(file: File, bytes: Buffer): Promise<string> {
  try {
    if (/pdf/i.test(file.type) || file.name.toLowerCase().endsWith(".pdf")) {
      return await extractPdfText(file, bytes);
    }
    if (/wordprocessingml/i.test(file.type) || file.name.toLowerCase().endsWith(".docx")) {
      return await extractDocxText(bytes);
    }
    if (/spreadsheetml|ms-excel/i.test(file.type) || /\.(xlsx|xls)$/i.test(file.name)) {
      return extractXlsxText(bytes);
    }
    if (/text|json|csv/i.test(file.type)) {
      return bytes.toString("utf8").slice(0, 10000);
    }
  } catch (err) {
    console.error("Error extrayendo texto del documento:", err);
  }
  return `Archivo cargado: ${file.name}.`;
}

async function extractPdfText(file: File, bytes: Buffer): Promise<string> {
  const parser = new PDFParse({ data: bytes });
  // pageJoiner: "" - por defecto pdf-parse inserta un separador "-- N of M --" entre
  // páginas incluso cuando no hay texto real (PDF escaneado); sin esto, ese separador
  // se cuela como si fuera contenido y nunca se activa el fallback de OCR.
  const pdfData = await parser.getText({ pageJoiner: "" });
  await parser.destroy();
  const embeddedText = pdfData.text.trim();
  if (embeddedText) return embeddedText.slice(0, MAX_CHARS);

  // Sin capa de texto (PDF escaneado): OCR real con Tesseract sobre las primeras páginas.
  try {
    const ocrText = await extractTextWithOcr(bytes);
    if (ocrText) return ocrText;
  } catch (ocrError) {
    console.error("Error de OCR sobre PDF escaneado:", ocrError);
  }
  return `PDF escaneado: ${file.name}. (OCR no pudo extraer texto legible)`;
}

async function extractDocxText(bytes: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: bytes });
  return result.value.trim().slice(0, MAX_CHARS);
}

function extractXlsxText(bytes: Buffer): string {
  const workbook = XLSX.read(bytes, { type: "buffer" });
  let combined = "";
  for (const sheetName of workbook.SheetNames) {
    const sheetCsv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    combined += `--- Hoja: ${sheetName} ---\n${sheetCsv}\n\n`;
    if (combined.length >= MAX_CHARS) break;
  }
  return combined.trim().slice(0, MAX_CHARS);
}

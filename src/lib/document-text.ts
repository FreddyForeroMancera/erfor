import * as XLSX from "xlsx";
import mammoth from "mammoth";
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";
import { extractTextWithOcr } from "@/lib/ocr";

const MAX_CHARS = 15000;

/**
 * Extrae el mejor texto disponible de un archivo subido (PDF con o sin capa de texto,
 * DOCX, XLSX/XLS, KML/KMZ, texto plano) para alimentar el prompt de extracción con IA.
 * Usado tanto por la carga interna (documents/upload) como por el portal de clientes
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
    if (file.name.toLowerCase().endsWith(".kml")) {
      return summarizeKmlText(bytes.toString("utf8"));
    }
    if (file.name.toLowerCase().endsWith(".kmz")) {
      return await extractKmzText(bytes);
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

/**
 * KML es XML plano: en vez de un parser XML completo, se extraen con regex los pares
 * <name>/<coordinates> de cada Placemark (y el <name> del <Document> si existe), que es
 * lo único relevante para identificar el predio y su ubicación.
 */
export function parseKmlPlacemarks(xml: string): { names: string[]; coordinateBlocks: string[] } {
  const names = [...xml.matchAll(/<name>([\s\S]*?)<\/name>/gi)]
    .map((m) => stripXmlTags(m[1]).trim())
    .filter(Boolean);
  const coordinateBlocks = [...xml.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/gi)]
    .map((m) => m[1].trim().replace(/\s+/g, " "))
    .filter(Boolean);
  return { names, coordinateBlocks };
}

/**
 * Extracción determinística (sin IA) de nombre + coordenadas de un .kml/.kmz, para que
 * el predio quede geolocalizado incluso si la cuota gratuita de Gemini/OpenAI está agotada
 * ese día. Se usa aparte del resumen de texto que sí se le pasa a la IA en el flujo normal.
 */
export async function extractKmlGeoData(
  file: File,
  bytes: Buffer
): Promise<{ name: string | null; coordinates: string | null }> {
  let xml = "";
  if (file.name.toLowerCase().endsWith(".kmz")) {
    const zip = await JSZip.loadAsync(bytes);
    const kmlEntry = Object.values(zip.files).find(
      (entry) => !entry.dir && entry.name.toLowerCase().endsWith(".kml")
    );
    if (!kmlEntry) return { name: null, coordinates: null };
    xml = await kmlEntry.async("text");
  } else {
    xml = bytes.toString("utf8");
  }
  const { names, coordinateBlocks } = parseKmlPlacemarks(xml);
  return {
    name: names[0] || null,
    coordinates: coordinateBlocks[0] ? coordinateBlocks[0].slice(0, 2000) : null
  };
}

function summarizeKmlText(xml: string): string {
  const { names, coordinateBlocks } = parseKmlPlacemarks(xml);
  if (names.length === 0 && coordinateBlocks.length === 0) {
    return "Archivo KML sin placemarks ni coordenadas reconocibles.";
  }
  let summary = "Archivo geoespacial KML.\n";
  if (names.length > 0) summary += `Nombres encontrados: ${names.join(", ")}.\n`;
  coordinateBlocks.forEach((coords, i) => {
    summary += `Coordenadas ${i + 1}: ${coords}\n`;
  });
  return summary.trim().slice(0, MAX_CHARS);
}

function stripXmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

/**
 * KMZ es un .kml comprimido en ZIP (jszip: puro JS, sin binario nativo — evita repetir el
 * problema de empaquetado que tuvimos con @napi-rs/canvas en Vercel). Busca el primer
 * .kml dentro del archivo, sin importar el nombre interno.
 */
async function extractKmzText(bytes: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const kmlEntry = Object.values(zip.files).find(
    (entry) => !entry.dir && entry.name.toLowerCase().endsWith(".kml")
  );
  if (!kmlEntry) return "Archivo KMZ sin contenido .kml reconocible.";
  const xml = await kmlEntry.async("text");
  return summarizeKmlText(xml);
}

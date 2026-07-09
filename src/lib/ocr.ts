import os from "node:os";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

/**
 * Carga perezosa y tolerante a fallos del polyfill de canvas.
 *
 * pdf-parse (vía pdfjs-dist) necesita los globals DOMMatrix/ImageData/Path2D para
 * *rasterizar* páginas (getScreenshot, la ruta de OCR); su auto-polyfill interno usa
 * un `require("@napi-rs/canvas")` construido dinámicamente que el file tracer de Vercel
 * no sigue, así que el binario nativo no llega a la función serverless y el render
 * revienta con "DOMMatrix is not defined".
 *
 * Importante: NO se importa @napi-rs/canvas en el top-level. Un import estático del
 * binario nativo hace que TODO el módulo (y por ende la ruta /api/documents/upload)
 * falle a la carga con 500 si el binario de la plataforma no está — matando incluso la
 * extracción de PDFs con capa de texto que ni siquiera necesitan canvas. Por eso se
 * carga aquí, de forma perezosa, solo cuando se va a hacer OCR, y si falla se degrada
 * (el llamador ya cae a un texto de respaldo en vez de tumbar la subida).
 */
async function ensureCanvasGlobals(): Promise<void> {
  const g = globalThis as any;
  if (g.DOMMatrix && g.ImageData && g.Path2D) return;
  const canvas = await import("@napi-rs/canvas");
  if (!g.DOMMatrix) g.DOMMatrix = canvas.DOMMatrix;
  if (!g.ImageData) g.ImageData = canvas.ImageData;
  if (!g.Path2D) g.Path2D = canvas.Path2D;
}

const MAX_PAGES = 5;
const MAX_CHARS = 15000;
const RENDER_SCALE = 2.0;

/**
 * OCR de respaldo para PDFs escaneados (sin capa de texto seleccionable).
 * Usa el renderizado a PNG que ya trae pdf-parse (getScreenshot) en vez de una copia
 * propia de pdfjs-dist/@napi-rs/canvas: pdf-parse ya depende de ambos internamente, y
 * mezclar una segunda copia de pdfjs-dist en el mismo proceso rompe el worker de pdf.js
 * ("API version X does not match Worker version Y").
 * Rasteriza hasta MAX_PAGES páginas y corre Tesseract en español sobre cada una.
 */
export async function extractTextWithOcr(bytes: Buffer): Promise<string> {
  // Debe correr antes de getScreenshot: deja DOMMatrix/ImageData/Path2D en globalThis.
  await ensureCanvasGlobals();

  const parser = new PDFParse({ data: bytes });
  const worker = await createWorker("spa", undefined, {
    cachePath: os.tmpdir()
  });

  try {
    const screenshots = await parser.getScreenshot({ scale: RENDER_SCALE, first: MAX_PAGES });

    let combined = "";
    for (const page of screenshots.pages) {
      const { data } = await worker.recognize(page.data as Buffer);
      combined += `${data.text}\n`;

      if (combined.length >= MAX_CHARS) break;
    }
    return combined.trim().slice(0, MAX_CHARS);
  } finally {
    await worker.terminate();
    await parser.destroy();
  }
}

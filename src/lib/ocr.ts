import os from "node:os";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

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

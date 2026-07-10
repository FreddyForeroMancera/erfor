import * as XLSX from "xlsx";
import type { EnvironmentalFile } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ExtractedPropertyData = {
  name?: string | null;
  cadastralCode?: string | null;
  realEstateRegistration?: string | null;
  city?: string | null;
  village?: string | null;
  owner?: string | null;
  address?: string | null;
  representative?: string | null;
  type?: string | null;
  coordinates?: string | null;
};

export function selectKeyDocument(documents: any[]) {
  if (!documents || documents.length === 0) return null;

  // Priorizar documentos por nombre
  const keywords = ["auto", "resolucion", "resolución", "requerimiento", "concepto", "indagacion", "indagación"];
  
  for (const doc of documents) {
    const name = doc.name.toLowerCase();
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        return doc;
      }
    }
  }

  // Si no encuentra coincidencia, devuelve el primer documento
  return documents[0];
}

export function buildExtractionPrompt(text: string): string {
  return `Eres un asistente legal ambiental colombiano experto en lectura de expedientes (CAR, ANLA, etc.).
Del siguiente texto extraído de un documento legal, identifica la información del PREDIO o PROYECTO asociado al expediente.

Responde SOLO con un objeto JSON válido con esta estructura exacta, sin texto adicional ni bloques de markdown (ni siquiera \`\`\`json):
{
  "name": "Nombre del predio, hacienda, finca o proyecto. Si no aparece, devuelve null.",
  "cadastralCode": "Cédula catastral si aparece, sino null.",
  "realEstateRegistration": "Matrícula inmobiliaria si aparece, sino null.",
  "city": "Municipio si aparece, sino null.",
  "village": "Vereda si aparece, sino null.",
  "owner": "Propietario si aparece, sino null.",
  "address": "Dirección física del predio (calle, carrera, vereda con nomenclatura) si aparece, sino null.",
  "representative": "Nombre completo de quien actúa como representante legal del cliente/solicitante (persona jurídica) si aparece, sino null.",
  "type": "Infiere el TIPO DE PERMISO o TRÁMITE del documento (ej. 'Concesión de aguas', 'Vertimiento', 'Ocupación de cauce', 'Sancionatorio', 'Aprovechamiento forestal'). Si no es claro, devuelve null.",
  "coordinates": "Coordenadas geográficas del predio (latitud/longitud) si aparecen explícitamente en el texto, sino null."
}

TEXTO DEL DOCUMENTO:
${text.slice(0, 15000)} // Límite para no exceder contexto
`;
}

/**
 * Extrae los datos del predio/cliente con IA. Gemini corre primero (nivel gratuito de
 * Google, sin costo hasta la cuota diaria); si no hay GEMINI_API_KEY configurada o la
 * llamada falla, cae a OpenAI como respaldo. Si ninguna de las dos está configurada,
 * se omite la extracción (no rompe el flujo de subida).
 */
export async function extractPropertyFromText(text: string): Promise<ExtractedPropertyData | null> {
  if (!text || text.trim() === "") return null;

  const prompt = buildExtractionPrompt(text);
  const providers: { key: string | undefined; label: string; call: (p: string) => Promise<ExtractedPropertyData | null> }[] = [
    { key: process.env.GEMINI_API_KEY, label: "Gemini", call: callGemini },
    { key: process.env.OPENAI_API_KEY, label: "OpenAI", call: callOpenAI }
  ];

  let anyConfigured = false;
  for (const provider of providers) {
    if (!provider.key) continue;
    anyConfigured = true;
    const result = await provider.call(prompt);
    if (result) return result;
    console.warn(`${provider.label} no devolvió un resultado utilizable; intentando siguiente proveedor.`);
  }

  if (!anyConfigured) {
    console.warn("No hay GEMINI_API_KEY ni OPENAI_API_KEY configuradas; se omite la extracción con IA.");
  }
  return null;
}

async function callGemini(prompt: string): Promise<ExtractedPropertyData | null> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY as string,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        })
      }
    );

    if (response.ok) {
      const json = await response.json();
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        return JSON.parse(content);
      }
    } else {
      console.error("Gemini API error:", await response.text());
    }
  } catch (error) {
    console.error("Error extracting property with Gemini:", error);
  }
  return null;
}

async function callOpenAI(prompt: string): Promise<ExtractedPropertyData | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (response.ok) {
      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } else {
      console.error("OpenAI API error:", await response.text());
    }
  } catch (error) {
    console.error("Error extracting property with OpenAI:", error);
  }

  return null;
}

/**
 * Parsea el CSV de datos preestablecidos de un cliente (una fila por expediente) a un
 * mapa `internalCode -> ExtractedPropertyData`, listo para pasarle a applyExtractedProperty.
 * Columnas esperadas: expedienteCode, representative, propertyName, propertyAddress,
 * propertyOwner, cadastralCode, realEstateRegistration, city, village.
 */
export function parseClientDataCsv(csvText: string | undefined | null): Map<string, ExtractedPropertyData> {
  const rowsByExpediente = new Map<string, ExtractedPropertyData>();
  if (!csvText || !csvText.trim()) return rowsByExpediente;

  const workbook = XLSX.read(csvText, { type: "string" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return rowsByExpediente;

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: "" });
  for (const row of rows) {
    const expedienteCode = String(row.expedienteCode || "").trim();
    if (!expedienteCode) continue;

    rowsByExpediente.set(expedienteCode, {
      name: String(row.propertyName || "").trim() || null,
      address: String(row.propertyAddress || "").trim() || null,
      owner: String(row.propertyOwner || "").trim() || null,
      representative: String(row.representative || "").trim() || null,
      cadastralCode: String(row.cadastralCode || "").trim() || null,
      realEstateRegistration: String(row.realEstateRegistration || "").trim() || null,
      city: String(row.city || "").trim() || null,
      village: String(row.village || "").trim() || null
    });
  }

  return rowsByExpediente;
}

/**
 * Crea o enriquece el Property de un expediente a partir de datos extraídos por IA, y
 * llena Client.representative si estaba vacío. Regla fija: solo se completan campos
 * vacíos, nunca se sobreescribe un valor que un consultor ya haya cargado a mano.
 */
export async function applyExtractedProperty(
  expediente: Pick<EnvironmentalFile, "id" | "clientId" | "propertyId" | "type">,
  extractedData: ExtractedPropertyData
) {
  if (!extractedData?.name || expediente.propertyId) return null;

  let property = await prisma.property.findFirst({
    where: { clientId: expediente.clientId, name: extractedData.name }
  });

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
        address: extractedData.address || null,
        coordinates: extractedData.coordinates || null
      }
    });
  } else {
    const propertyUpdate: Record<string, string> = {};
    if (!property.cadastralCode && extractedData.cadastralCode) propertyUpdate.cadastralCode = extractedData.cadastralCode;
    if (!property.realEstateRegistration && extractedData.realEstateRegistration) propertyUpdate.realEstateRegistration = extractedData.realEstateRegistration;
    if (!property.city && extractedData.city) propertyUpdate.city = extractedData.city;
    if (!property.village && extractedData.village) propertyUpdate.village = extractedData.village;
    if (!property.coordinates && extractedData.coordinates) propertyUpdate.coordinates = extractedData.coordinates;
    if (!property.owner && extractedData.owner) propertyUpdate.owner = extractedData.owner;
    if (!property.address && extractedData.address) propertyUpdate.address = extractedData.address;
    if (Object.keys(propertyUpdate).length > 0) {
      property = await prisma.property.update({ where: { id: property.id }, data: propertyUpdate });
    }
  }

  const environmentalFileUpdate: { propertyId: string; type?: string } = { propertyId: property.id };
  if (extractedData.type && expediente.type === "Desconocido") {
    environmentalFileUpdate.type = extractedData.type;
  }
  await prisma.environmentalFile.update({ where: { id: expediente.id }, data: environmentalFileUpdate });

  if (extractedData.representative) {
    const client = await prisma.client.findUnique({ where: { id: expediente.clientId } });
    if (client && !client.representative) {
      await prisma.client.update({ where: { id: client.id }, data: { representative: extractedData.representative } });
    }
  }

  return { property, updatedType: environmentalFileUpdate.type || null };
}

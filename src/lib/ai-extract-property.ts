import { prisma } from "@/lib/prisma";

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

export async function extractPropertyFromText(text: string) {
  if (!text || text.trim() === "") return null;
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn("No OPENAI_API_KEY found, skipping AI property extraction");
    return null;
  }

  const prompt = `Eres un asistente legal ambiental colombiano experto en lectura de expedientes (CAR, ANLA, etc.). 
Del siguiente texto extraído de un documento legal, identifica la información del PREDIO o PROYECTO asociado al expediente.

Responde SOLO con un objeto JSON válido con esta estructura exacta, sin texto adicional ni bloques de markdown (ni siquiera \`\`\`json):
{
  "name": "Nombre del predio, hacienda, finca o proyecto. Si no aparece, devuelve null.",
  "cadastralCode": "Cédula catastral si aparece, sino null.",
  "realEstateRegistration": "Matrícula inmobiliaria si aparece, sino null.",
  "city": "Municipio si aparece, sino null.",
  "village": "Vereda si aparece, sino null.",
  "owner": "Propietario si aparece, sino null.",
  "type": "Infiere el TIPO DE PERMISO o TRÁMITE del documento (ej. 'Concesión de aguas', 'Vertimiento', 'Ocupación de cauce', 'Sancionatorio', 'Aprovechamiento forestal'). Si no es claro, devuelve null."
}

TEXTO DEL DOCUMENTO:
${text.slice(0, 15000)} // Límite para no exceder contexto
`;

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
    console.error("Error extracting property with AI:", error);
  }

  return null;
}

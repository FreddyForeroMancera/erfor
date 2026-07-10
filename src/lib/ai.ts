import { prisma } from "@/lib/prisma";

export async function buildContext(params: {
  clientId?: string | null;
  projectId?: string | null;
  environmentalFileId?: string | null;
}) {
  const [client, project, file, requirements, documents, obligations, alerts] = await Promise.all([
    params.clientId ? prisma.client.findUnique({ where: { id: params.clientId } }) : null,
    params.projectId ? prisma.project.findUnique({ where: { id: params.projectId } }) : null,
    params.environmentalFileId ? prisma.environmentalFile.findUnique({ where: { id: params.environmentalFileId } }) : null,
    prisma.requirement.findMany({ where: compactWhere(params), orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.document.findMany({ where: compactWhere(params), orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.environmentalObligation.findMany({ where: compactWhere(params), orderBy: { dueDate: "asc" }, take: 8 }),
    prisma.alert.findMany({ where: compactWhere(params), orderBy: { dueDate: "asc" }, take: 8 })
  ]);
  return { client, project, file, requirements, documents, obligations, alerts };
}

function compactWhere(params: Record<string, string | null | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => Boolean(value)));
}

export async function answerWithAI(question: string, params: { clientId?: string | null; projectId?: string | null; environmentalFileId?: string | null }) {
  const context = await buildContext(params);
  const sources = [
    ...context.requirements.map((item) => `Requerimiento ${item.filingNumber || item.id}`),
    ...context.documents.map((item) => `Documento ${item.name}`),
    ...context.obligations.map((item) => `Obligación ${item.title}`)
  ];

  const documentsContext = context.documents
    .filter(doc => doc.extractedText)
    .map(doc => `--- INICIO DOCUMENTO: ${doc.name} ---\n${doc.extractedText}\n--- FIN DOCUMENTO ---`)
    .join("\n\n");

  const metadataContext = JSON.stringify({
    client: context.client,
    project: context.project,
    requirements: context.requirements,
    obligations: context.obligations,
    alerts: context.alerts
  }).slice(0, 4000);

  const prompt = `Eres el Asistente Legal y Ambiental de IA ERFOR. Responde en español de forma profesional, precisa y directa. Basate ÚNICAMENTE en la información proporcionada.
  
Pregunta del usuario: ${question}

METADATOS DEL EXPEDIENTE:
${metadataContext}

CONTENIDO DE LOS DOCUMENTOS RECIENTES:
${documentsContext.slice(0, 20000)}`;

  const aiContent = await callAIChain(prompt);
  return { content: aiContent || localAnswer(question, context), sources };
}

/**
 * Misma cadena de respaldo que la extracción de predios (Gemini -> OpenAI), cada uno solo
 * si el anterior no está configurado o falla. Si ninguno responde, el llamador cae al
 * generador de texto por plantillas (localAnswer).
 */
async function callAIChain(prompt: string): Promise<string | null> {
  if (process.env.GEMINI_API_KEY) {
    const result = await callGeminiChat(prompt);
    if (result) return result;
    console.warn("Gemini no devolvió respuesta utilizable para el chat; intentando OpenAI.");
  }
  if (process.env.OPENAI_API_KEY) {
    return callOpenAiCompatibleChat("https://api.openai.com/v1/chat/completions", process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || "gpt-4o-mini", prompt, "OpenAI");
  }
  return null;
}

async function callGeminiChat(prompt: string): Promise<string | null> {
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
          generationConfig: { temperature: 0.3 }
        })
      }
    );
    if (response.ok) {
      const json = await response.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
    console.error("Gemini API error (chat):", await response.text());
  } catch (error) {
    console.error("Error consultando Gemini (chat):", error);
  }
  return null;
}

async function callOpenAiCompatibleChat(
  url: string,
  apiKey: string,
  model: string,
  prompt: string,
  label: string
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (response.ok) {
      const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      return json.choices?.[0]?.message?.content || null;
    }
    console.error(`${label} API error (chat):`, await response.text());
  } catch (error) {
    console.error(`Error consultando ${label} (chat):`, error);
  }
  return null;
}

function localAnswer(question: string, context: Awaited<ReturnType<typeof buildContext>>) {
  const requirement = context.requirements[0];
  const obligationList = context.obligations.map((item) => `- ${item.title}: ${item.status}, vence ${item.dueDate?.toISOString().slice(0, 10) || "sin fecha"}`).join("\n");
  const alertList = context.alerts.map((item) => `- ${item.title}: ${item.severity}, ${item.dueDate?.toISOString().slice(0, 10) || "sin fecha"}`).join("\n");
  const projectName = context.project?.name || context.client?.name || "el expediente consultado";

  if (/borrador|respuesta/i.test(question) && requirement) {
    return `Borrador sujeto a validación profesional para ${projectName}.\n\nEn atención al requerimiento ${requirement.filingNumber || ""} emitido por ${requirement.authority}, se propone responder que ERFOR se encuentra consolidando los soportes técnicos solicitados, incluyendo ${requirement.requestedDocuments || "los documentos aplicables al expediente"}. Se recomienda anexar evidencia documental, registros fotográficos y cualquier certificación técnica disponible antes de la radicación.\n\nRiesgo identificado: ${requirement.riskLevel}. Fecha límite registrada: ${requirement.dueDate?.toISOString().slice(0, 10) || "por confirmar"}.\n\nEsta respuesta no constituye concepto jurídico definitivo y debe ser revisada por el responsable técnico antes de enviarse.`;
  }

  if (/resume|resumen|requerimiento/i.test(question) && requirement) {
    return `Resumen sujeto a revisión profesional.\n\nEntidad: ${requirement.authority}\nRadicado: ${requirement.filingNumber || "por validar"}\nAsunto: ${requirement.subject}\nFecha límite: ${requirement.dueDate?.toISOString().slice(0, 10) || "por confirmar"}\nDocumentos solicitados: ${requirement.requestedDocuments || "no extraídos"}\n\nAcción recomendada: validar documentos faltantes, asignar responsable y preparar paquete de respuesta con anexos trazables.`;
  }

  return `Análisis preliminar para ${projectName}.\n\nAlertas activas:\n${alertList || "- Sin alertas abiertas registradas."}\n\nObligaciones relevantes:\n${obligationList || "- Sin obligaciones registradas en el contexto."}\n\nRecomendación: validar fechas, documentos fuente y responsables antes de tomar decisiones. No tengo autorización para inventar radicados, normas o fechas no cargadas en la plataforma.`;
}

import { PassThrough } from "node:stream";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export async function generateExecutivePdf(input: {
  userId: string;
  userName: string;
  clientId?: string | null;
  projectId?: string | null;
  title: string;
  type: string;
}) {
  const [client, project, obligations, requirements, alerts] = await Promise.all([
    input.clientId ? prisma.client.findUnique({ where: { id: input.clientId } }) : null,
    input.projectId ? prisma.project.findUnique({ where: { id: input.projectId } }) : null,
    prisma.environmentalObligation.findMany({ where: compactWhere(input), take: 20, orderBy: { dueDate: "asc" } }),
    prisma.requirement.findMany({ where: compactWhere(input), take: 20, orderBy: { dueDate: "asc" } }),
    prisma.alert.findMany({ where: compactWhere(input), take: 20, orderBy: { dueDate: "asc" } })
  ]);

  const fileName = `${Date.now()}-${input.type.toLowerCase()}.pdf`;

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const buffers: Buffer[] = [];
    const stream = new PassThrough();

    stream.on('data', chunk => buffers.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
    stream.on('error', reject);

    doc.pipe(stream);

    doc.fontSize(24).fillColor("#0f7a3d").text("ERFOR", { continued: true }).fillColor("#071d22").text(" — Plataforma Integral de Asesoría Ambiental");
    doc.moveDown();
    doc.fontSize(18).text(input.title);
    doc.fontSize(10).fillColor("#53666b").text(`Generado: ${new Date().toLocaleString("es-CO")}`);
    doc.moveDown();
    doc.fillColor("#071d22").fontSize(12).text(`Cliente: ${client?.name || "Todos"}`);
    doc.text(`Proyecto: ${project?.name || "Todos"}`);
    doc.text(`Responsable: ${input.userName}`);
    doc.moveDown();
    doc.fontSize(14).text("Resumen ejecutivo");
    doc.fontSize(11).text("Este informe consolida indicadores, hallazgos, riesgos y próximas acciones ambientales con base en la información cargada en ERFOR. Debe ser revisado por el responsable profesional antes de radicación externa.");
    doc.moveDown();
    doc.fontSize(14).text("Indicadores");
    doc.fontSize(11).text(`Obligaciones: ${obligations.length}`);
    doc.text(`Requerimientos: ${requirements.length}`);
    doc.text(`Alertas abiertas: ${alerts.length}`);
    doc.moveDown();
    doc.fontSize(14).text("Hallazgos y riesgos");
    for (const alert of alerts.slice(0, 8)) {
      doc.fontSize(10).text(`• ${alert.title} (${alert.severity}) - ${alert.dueDate?.toISOString().slice(0, 10) || "sin fecha"}`);
    }
    doc.moveDown();
    doc.fontSize(14).text("Próximas acciones");
    for (const obligation of obligations.slice(0, 8)) {
      doc.fontSize(10).text(`• ${obligation.title} - ${obligation.nextAction || "Validar evidencia y responsable."}`);
    }
    doc.end();
  });

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase no está configurado");
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("erfor-uploads")
    .upload(`reports/${fileName}`, pdfBuffer, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error("Error subiendo reporte a Supabase Storage: " + uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from("erfor-uploads")
    .getPublicUrl(`reports/${fileName}`);

  const publicUrl = publicUrlData.publicUrl;

  const report = await prisma.report.create({
    data: {
      clientId: input.clientId || undefined,
      projectId: input.projectId || undefined,
      type: input.type,
      title: input.title,
      fileUrl: publicUrl,
      generatedBy: input.userId,
      payload: JSON.stringify({ obligations: obligations.length, requirements: requirements.length, alerts: alerts.length })
    }
  });

  await prisma.document.create({
    data: {
      clientId: input.clientId || undefined,
      projectId: input.projectId || undefined,
      name: `${input.title}.pdf`,
      fileUrl: publicUrl,
      fileType: "application/pdf",
      category: "Informe",
      uploadedBy: input.userId,
      extractedText: `Informe generado: ${input.title}`
    }
  });

  return report;
}

function compactWhere(input: { clientId?: string | null; projectId?: string | null }) {
  return Object.fromEntries(
    Object.entries({ clientId: input.clientId || undefined, projectId: input.projectId || undefined }).filter(([, value]) => Boolean(value))
  );
}

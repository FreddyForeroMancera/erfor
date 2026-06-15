import * as XLSX from "xlsx";
import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    const target = String(form.get("target") || "clients");
    if (!(file instanceof File)) return Response.json({ error: "Archivo Excel requerido" }, { status: 400 });
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const preview = workbook.SheetNames.map((name) => {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: "" });
      return { name, columns: Object.keys(rows[0] || {}), rows: rows.slice(0, 10), totalRows: rows.length };
    });
    const job = await prisma.importJob.create({
      data: {
        type: target,
        fileName: file.name,
        status: "PREVIEW",
        sheetNames: workbook.SheetNames.join(", "),
        summary: JSON.stringify({ preview })
      }
    });
    return ok({ job, preview });
  } catch (error) {
    return fail(error);
  }
}

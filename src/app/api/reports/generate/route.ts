import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";
import { generateExecutivePdf } from "@/lib/report";

const schema = z.object({
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  title: z.string().default("Informe Ejecutivo Ambiental"),
  type: z.string().default("EXECUTIVE_REPORT")
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await readJson(request));
    const report = await generateExecutivePdf({ ...input, userId: user.id });
    return ok({ report }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

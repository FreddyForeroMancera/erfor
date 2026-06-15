import { requireUser } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function POST() {
  await requireUser();
  return ok({
    status: "READY_FOR_CONFIGURATION",
    message: "Conector preparado. Configure GOOGLE_SHEETS_API_KEY u OAuth para habilitar sincronización real."
  });
}

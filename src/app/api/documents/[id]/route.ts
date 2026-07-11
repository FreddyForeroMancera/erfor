import { canDelete, requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (!canDelete(user.role)) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }
    const { id } = await params;

    // 1. Cargar el documento
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return Response.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // 2. Si el archivo está en Supabase Storage, eliminarlo físicamente
    if (
      document.fileUrl &&
      document.fileUrl !== "PURGED" &&
      !document.fileUrl.startsWith("/uploads/")
    ) {
      const urlParts = document.fileUrl.split("/erfor-uploads/");
      if (urlParts.length >= 2) {
        const storagePath = decodeURIComponent(urlParts[1]);
        const supabaseUrl = process.env.SUPABASE_URL || "";
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { error: deleteError } = await supabase.storage
            .from("erfor-uploads")
            .remove([storagePath]);
          if (deleteError) {
            console.error("No se pudo eliminar el archivo físico de Supabase Storage:", deleteError);
          }
        }
      }
    }

    // 3. Eliminar el registro en la base de datos
    await prisma.document.delete({
      where: { id }
    });

    // 4. Registrar la actividad en el log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        entityType: "documents",
        entityId: id,
        description: `Eliminó el documento: "${document.name}"`
      }
    });

    return ok({ message: "Documento eliminado con éxito" });
  } catch (error) {
    return fail(error);
  }
}

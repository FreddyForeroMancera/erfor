import { canWrite, requireUser } from "@/lib/auth";
import { getResource } from "@/lib/crud";
import { fail, ok, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { z } from "zod";

export async function GET(_request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    await requireUser();
    const { resource, id } = await params;
    const config = getResource(resource);
    const item = await config.delegate.findUnique({ where: { id } });
    if (!item) return Response.json({ error: "No encontrado" }, { status: 404 });
    return ok({ item });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const user = await requireUser();
    if (!canWrite(user.role)) return Response.json({ error: "No autorizado" }, { status: 403 });
    const { resource, id } = await params;
    const config = getResource(resource);
    const data = (config.schema as z.AnyZodObject).partial().parse(await readJson(request));
    const item = await config.delegate.update({ where: { id }, data });
    await prisma.activityLog.create({
      data: { userId: user.id, action: "UPDATE", entityType: resource, entityId: id, description: `Actualizó registro en ${resource}` }
    });
    return ok({ item });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const user = await requireUser();
    if (!canWrite(user.role)) return Response.json({ error: "No autorizado" }, { status: 403 });
    const { resource, id } = await params;
    const config = getResource(resource);
    const item = await config.delegate.delete({ where: { id } });
    await prisma.activityLog.create({
      data: { userId: user.id, action: "DELETE", entityType: resource, entityId: id, description: `Archivó/eliminó registro en ${resource}` }
    });
    return ok({ item });
  } catch (error) {
    return fail(error);
  }
}

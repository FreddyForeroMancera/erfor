import { canWrite, requireUser } from "@/lib/auth";
import { buildWhere, getResource } from "@/lib/crud";
import { fail, ok, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    await requireUser();
    const { resource } = await params;
    const config = getResource(resource);
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    const where = buildWhere(url.searchParams, config.search, config.schema);
    const [items, total] = await Promise.all([
      config.delegate.findMany({ where, take: limit, skip: (page - 1) * limit, orderBy: { createdAt: "desc" } }),
      config.delegate.count({ where })
    ]);
    return ok({ items, total, page, limit });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const user = await requireUser();
    if (!canWrite(user.role)) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }
    const { resource } = await params;
    const config = getResource(resource);
    const data = config.schema.parse(await readJson(request));
    const item = await config.delegate.create({ data });
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: resource,
        entityId: typeof item === "object" && item && "id" in item ? String(item.id) : undefined,
        description: `Creó registro en ${resource}`
      }
    });
    return ok({ item }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

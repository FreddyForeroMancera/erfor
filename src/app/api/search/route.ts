import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireUser();
    const q = new URL(request.url).searchParams.get("q") || "";
    if (q.length < 2) return ok({ results: [] });
    const contains = { contains: q, mode: "insensitive" as any };
    const [clients, projects, properties, files, procedures, requirements, documents, obligations, legalRequirements, reports] = await Promise.all([
      prisma.client.findMany({ where: { OR: [{ name: contains }, { documentNumber: contains }] }, take: 8 }),
      prisma.project.findMany({ where: { client: { name: contains } }, take: 8 }),
      prisma.property.findMany({ where: { client: { name: contains } }, take: 8 }),
      prisma.environmentalFile.findMany({ where: { OR: [{ internalCode: contains }, { officialCode: contains }, { client: { name: contains } }] }, take: 8 }),
      prisma.procedure.findMany({ where: { OR: [{ environmentalFile: { internalCode: contains } }, { client: { name: contains } }] }, take: 8 }),
      prisma.requirement.findMany({ where: { OR: [{ environmentalFile: { internalCode: contains } }, { client: { name: contains } }] }, take: 8 }),
      prisma.document.findMany({ where: { OR: [{ name: contains }, { environmentalFile: { internalCode: contains } }] }, take: 8 }),
      prisma.environmentalObligation.findMany({ where: { OR: [{ title: contains }, { client: { name: contains } }] }, take: 8 }),
      prisma.legalRequirement.findMany({ where: { title: contains }, take: 8 }),
      prisma.report.findMany({ where: { OR: [{ title: contains }, { client: { name: contains } }] }, take: 8 })
    ]);
    return ok({ results: { clients, projects, properties, files, procedures, requirements, documents, obligations, legalRequirements, reports } });
  } catch (error) {
    return fail(error);
  }
}

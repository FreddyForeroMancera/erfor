import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const usageResult = await prisma.document.aggregate({
      _sum: { fileSize: true },
      where: { fileUrl: { not: "PURGED" } }
    });
    const currentUsageBytes = usageResult._sum.fileSize || 0;
    const quotaBytes = 900 * 1024 * 1024; // 900 MB
    
    return NextResponse.json({
      usedBytes: currentUsageBytes,
      quotaBytes: quotaBytes,
      percentage: Math.min(100, Math.round((currentUsageBytes / quotaBytes) * 100))
    });
  } catch (error) {
    return NextResponse.json({ error: "Error fetch quota" }, { status: 500 });
  }
}

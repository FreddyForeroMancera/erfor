import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    
    // Buscar todos los expedientes que no tienen propertyId ni projectId
    const expedientes = await prisma.environmentalFile.findMany({
      where: {
        propertyId: null,
        projectId: null
      },
      include: {
        documents: true
      },
      take: 20 // Límite de batch para no saturar la API ni Vercel timeout
    });

    if (expedientes.length === 0) {
      return NextResponse.json({ 
        message: "No hay expedientes sin predio asociado",
        results: { analyzed: 0, found: 0, failed: 0 }
      });
    }

    const results = { analyzed: 0, found: 0, failed: 0 };
    const originUrl = req.headers.get("origin") || "http://localhost:5173";

    for (const expediente of expedientes) {
      if (!expediente.documents || expediente.documents.length === 0) {
        results.failed++;
        continue;
      }

      try {
        results.analyzed++;
        
        // Llamar a nuestra propia API individual
        const res = await fetch(`${originUrl}/api/ai/extract-property`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": req.headers.get("cookie") || "" // Pasar sesión
          },
          body: JSON.stringify({ environmentalFileId: expediente.id })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.property) {
            results.found++;
          }
        }
        
        // Delay para no exceder limits de OpenAI
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error(`Error analyzing expediente ${expediente.id}:`, err);
        results.failed++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Análisis masivo completado",
      results 
    });

  } catch (error: any) {
    if (error && typeof error.status === "number") {
      return NextResponse.json({ error: "No autenticado o permiso denegado" }, { status: error.status });
    }
    console.error("Error en extract-property batch:", error);
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 400 });
  }
}

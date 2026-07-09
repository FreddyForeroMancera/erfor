import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { verifyActivationToken } from "@/lib/auth";

const activateSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = activateSchema.parse(body);

    // Verify token (misma librería/secreto que la sesión: ver src/lib/auth.ts)
    let userId: string;
    try {
      userId = await verifyActivationToken(data.token);
    } catch {
      return NextResponse.json({ error: "El enlace es inválido o ha expirado." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Update user password and ensure it's active
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash,
        status: "ACTIVE"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error activating account:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

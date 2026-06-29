import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_for_development_only_12345";

const activateSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = activateSchema.parse(body);

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(data.token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: "El enlace es inválido o ha expirado." }, { status: 400 });
    }

    if (decoded.type !== "activation") {
      return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    }

    // Verify user exists and is a client
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    
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

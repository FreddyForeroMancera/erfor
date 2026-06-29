import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, readJson } from "@/lib/http";
import { setSession, verifyPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  source: z.enum(["internal", "portal"]).optional()
});

export async function POST(request: Request) {
  try {
    const { email, password, source } = schema.parse(await readJson(request));
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Cross-access validation
    if (source === "portal" && user.role !== "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No autorizado para usar este portal" }, { status: 403 });
    }
    if (source === "internal" && user.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "Usa el portal de clientes" }, { status: 403 });
    }

    await setSession(user);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    return fail(error);
  }
}

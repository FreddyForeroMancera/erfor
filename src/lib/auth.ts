import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { Role, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cookieName, secret } from "@/lib/session";

export type SessionUser = Pick<User, "id" | "name" | "email" | "role" | "avatar">;

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: SessionUser) {
  return new SignJWT({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function setSession(user: SessionUser) {
  const token = await createToken(user);
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearSession() {
  (await cookies()).delete(cookieName);
}

/**
 * Verifica un token de activación de cuenta (mismo secreto/librería que la sesión).
 * Devuelve el userId codificado en el token, o lanza si es inválido/expirado/de otro tipo.
 */
export async function verifyActivationToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, secret);
  if (payload.type !== "activation" || typeof payload.sub !== "string") {
    throw new Error("Token de activación inválido");
  }
  return payload.sub;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.sub),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
      avatar: payload.avatar ? String(payload.avatar) : null
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSessionUser();
  if (!session) {
    throw new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    throw new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 401 });
  }
  return user;
}

export async function requireConsultant() {
  const user = await requireUser();
  if (user.role === "CLIENTE_EXTERNO") {
    throw new Response(JSON.stringify({ error: "Acceso denegado: Se requiere rol de consultor" }), { status: 403 });
  }
  return user;
}

export function canWrite(role: Role) {
  return role !== Role.AUDITOR && role !== Role.CLIENTE_EXTERNO;
}

export function canDelete(role: Role) {
  return role === Role.SUPER_ADMIN || role === Role.DIRECTOR_AMBIENTAL;
}

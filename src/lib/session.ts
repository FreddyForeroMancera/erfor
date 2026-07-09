import { jwtVerify } from "jose";

/**
 * Utilidades de sesión sin dependencias de Node/Prisma, para que también puedan
 * importarse desde middleware.ts (Edge runtime). La verificación completa con
 * lookup de usuario en base de datos vive en src/lib/auth.ts (requireUser).
 */

export const cookieName = "erfor_session";

function resolveJwtSecret() {
  const value = process.env.JWT_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no está configurado. Es obligatorio en producción para firmar/verificar sesiones y tokens de activación.");
  }
  return "dev-erfor-secret";
}

export const secret = new TextEncoder().encode(resolveJwtSecret());

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

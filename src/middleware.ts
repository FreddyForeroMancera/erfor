import { NextResponse, type NextRequest } from "next/server";
import { cookieName, isValidSessionToken } from "@/lib/session";

/**
 * Guard de sesión centralizado para las páginas internas del equipo ERFOR.
 * Solo verifica "¿hay una cookie de sesión válida?" (sin lookup a base de datos,
 * por eso puede correr en Edge). La autorización fina por rol se sigue resolviendo
 * en cada page.tsx / route.ts, igual que antes.
 *
 * Quedan fuera del matcher (y por lo tanto de este guard):
 * - /login: pantalla de acceso del equipo interno.
 * - /portal/*: el portal de clientes tiene su propio guard en (portal-app)/portal/layout.tsx.
 * - /api/*: cada ruta ya valida con requireUser()/requireConsultant().
 * - /uploads/*: sirve archivos binarios, no HTML; no aplica un redirect a /login.
 * - Assets internos de Next y archivos estáticos.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  const authenticated = await isValidSessionToken(token);

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|portal|login|uploads|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"
  ]
};

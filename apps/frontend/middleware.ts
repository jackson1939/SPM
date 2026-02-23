// middleware.ts — Protección de rutas a nivel de servidor (Edge Runtime)
// Corre ANTES de que Next.js sirva cualquier página o API route.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "spm_session";

// Rutas públicas (no requieren sesión)
const PUBLIC_PAGES = new Set(["/", "/login", "/404", "/_error"]);

// Prefijos de API que NO requieren sesión
const PUBLIC_API_PREFIXES = ["/api/auth/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Páginas públicas
  if (PUBLIC_PAGES.has(pathname)) return NextResponse.next();

  // APIs públicas (login, logout, me)
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Verificar que existe la cookie de sesión
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const hasSession = Boolean(sessionCookie?.value?.trim());

  if (!hasSession) {
    // API sin sesión → 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "No autenticado. Inicia sesión para continuar." },
        { status: 401 }
      );
    }
    // Página sin sesión → redirigir al login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Aplicar middleware a todo excepto archivos estáticos y recursos de Next.js
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};

// hooks/useRoleGuard.ts
// Protección de rutas basada en rol (RBAC) — verifica la sesión en el servidor
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export type AppRole = "jefe" | "almacen" | "cajero";

interface RoleGuardResult {
  authorized: boolean;
  role: AppRole | null;
  loading: boolean;
}

/**
 * Hook para proteger páginas según el rol del usuario.
 *
 * Uso:
 *   const { authorized, loading } = useRoleGuard(["jefe", "almacen"]);
 *   if (loading) return null;
 *   if (!authorized) return <AccesoDenegado />;
 *
 * Flujo de verificación:
 * 1. Llama a /api/auth/me con timeout de 8s para verificar la cookie de sesión
 *    - 401: sesión expirada/inválida → limpia localStorage y redirige a /login
 *    - OK: sincroniza el rol desde el servidor (fuente de verdad)
 * 2. Error de red / timeout: usa localStorage como fallback real (modo offline)
 *    - Si hay rol en localStorage → continuar sin redirigir al login
 *    - Si no hay rol → redirigir al login (primera vez sin sesión)
 */
export function useRoleGuard(allowedRoles: AppRole[]): RoleGuardResult {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRole = localStorage.getItem("role") as AppRole | null;

    // AbortController para cancelar el fetch si tarda más de 8 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch("/api/auth/me", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeoutId);

        if (res.status === 401) {
          // El servidor confirma que la sesión es inválida/expirada → redirigir
          localStorage.removeItem("role");
          router.replace("/login");
          return null;
        }

        if (!res.ok) {
          // Error del servidor (5xx) — no es culpa del usuario, usar fallback
          throw new Error("server_error");
        }

        return res.json();
      })
      .then((data) => {
        if (!data) return; // ya se redirigió a /login

        // El servidor es la fuente de verdad para el rol
        const serverRole = data.role as AppRole;
        if (serverRole !== storedRole) {
          localStorage.setItem("role", serverRole);
        }
        setRole(serverRole);
        setAuthorized((allowedRoles as string[]).includes(serverRole));
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);

        // Error de red, timeout (AbortError) o error 5xx del servidor.
        // No redirigir al login — puede ser un problema momentáneo de conexión.
        // El useSessionTimeout (17 min de inactividad) se encarga del logout real.
        if (!storedRole) {
          // Sin rol persistido y sin servidor → forzar login (primera vez)
          router.replace("/login");
          return;
        }

        // Hay un rol en localStorage → confiar en él mientras la red se recupera
        console.warn("[useRoleGuard] Error de red al verificar sesión, usando fallback:", err?.name ?? err);
        setRole(storedRole);
        setAuthorized((allowedRoles as string[]).includes(storedRole));
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { authorized, role, loading };
}

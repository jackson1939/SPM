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
 * 1. Si no hay role en localStorage → redirige a /login
 * 2. Llama a /api/auth/me para verificar que la cookie de sesión sea válida
 *    - 401: sesión expirada/inválida → limpia localStorage y redirige a /login
 *    - OK: sincroniza el rol desde el servidor (fuente de verdad)
 * 3. Error de red: usa localStorage como fallback (para modo offline)
 */
export function useRoleGuard(allowedRoles: AppRole[]): RoleGuardResult {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRole = localStorage.getItem("role") as AppRole | null;

    if (!storedRole) {
      router.replace("/login");
      return;
    }

    // Verificar con el servidor que la cookie de sesión sea válida
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then(async (res) => {
        if (res.status === 401) {
          // Sesión inválida o expirada — limpiar y redirigir
          localStorage.removeItem("role");
          router.replace("/login");
          return null;
        }
        if (!res.ok) {
          // Error del servidor — fallback a localStorage
          throw new Error("server_error");
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return; // ya se redirigió a /login

        // El servidor es la fuente de verdad para el rol
        const serverRole = (data.role ?? storedRole) as AppRole;
        if (serverRole !== storedRole) {
          localStorage.setItem("role", serverRole);
        }
        setRole(serverRole);
        setAuthorized((allowedRoles as string[]).includes(serverRole));
        setLoading(false);
      })
      .catch(() => {
        // Error de red / timeout — confiar en localStorage (soporte offline)
        setRole(storedRole);
        setAuthorized((allowedRoles as string[]).includes(storedRole));
        setLoading(false);
      });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { authorized, role, loading };
}

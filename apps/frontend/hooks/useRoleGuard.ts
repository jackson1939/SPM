// hooks/useRoleGuard.ts
// Protección de rutas basada en rol (RBAC client-side)
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
 *   if (loading) return <Spinner />;
 *   if (!authorized) return <AccesoDenegado />;
 *
 * - Si no hay sesión activa  → redirige a /login
 * - Si el rol no está permitido → devuelve authorized=false
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
      // No hay sesión — redirigir a login
      router.replace("/login");
      return;
    }

    setRole(storedRole);

    const isAllowed = (allowedRoles as string[]).includes(storedRole);
    setAuthorized(isAllowed);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { authorized, role, loading };
}

// lib/apiAuth.ts — Helper para proteger rutas API con autenticación de sesión
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionFromRequest, SessionPayload } from "./auth";

export type AppRole = "jefe" | "almacen" | "cajero";

/**
 * Verifica que la solicitud tenga una sesión válida y que el rol esté permitido.
 * Si no hay sesión → 401. Si el rol no está permitido → 403.
 * Retorna el payload de sesión si todo está OK, o null si se envió una respuesta de error.
 *
 * Uso:
 *   const session = requireAuth(req, res);
 *   if (!session) return; // ya se envió 401/403
 *
 *   const session = requireAuth(req, res, ["jefe", "almacen"]);
 *   if (!session) return;
 */
export function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles?: AppRole[]
): SessionPayload | null {
  const session = getSessionFromRequest(req);

  if (!session) {
    res.status(401).json({ error: "No autenticado. Inicia sesión para continuar." });
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!(allowedRoles as string[]).includes(session.role)) {
      res.status(403).json({
        error: `Acceso denegado. Se requiere uno de los roles: ${allowedRoles.join(", ")}.`,
      });
      return null;
    }
  }

  return session;
}

// /api/auth/me — Devuelve el usuario actual desde la cookie de sesión
// También renueva la cookie automáticamente si queda menos de 3h de vida.
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getSessionFromRequest,
  createSessionToken,
  setSessionCookie,
} from "../../../lib/auth";

// Si quedan menos de 3 horas, renovar la sesión automáticamente
const RENEW_THRESHOLD_MS = 3 * 60 * 60 * 1000;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const session = getSessionFromRequest(req);

  if (!session) {
    return res.status(401).json({ error: "No autenticado" });
  }

  // Renovar cookie si le queda poco tiempo — el usuario no nota nada
  if (session.exp - Date.now() < RENEW_THRESHOLD_MS) {
    const newToken = createSessionToken(
      session.username,
      session.role,
      session.nombre
    );
    setSessionCookie(res, newToken);
  }

  return res.status(200).json({
    username: session.username,
    role: session.role,
    nombre: session.nombre,
  });
}

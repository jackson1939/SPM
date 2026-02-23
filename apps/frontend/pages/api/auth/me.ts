// /api/auth/me — Devuelve el usuario actual desde la cookie de sesión
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionFromRequest } from "../../../lib/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const session = getSessionFromRequest(req);

  if (!session) {
    return res.status(401).json({ error: "No autenticado" });
  }

  return res.status(200).json({
    username: session.username,
    role: session.role,
    nombre: session.nombre,
  });
}

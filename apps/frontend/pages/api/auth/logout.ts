// /api/auth/logout — Cierra sesión limpiando la cookie httpOnly
import type { NextApiRequest, NextApiResponse } from "next";
import { clearSessionCookie, getSessionFromRequest } from "../../../lib/auth";
import { registrarAuditoria } from "../../../lib/auditoria";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const session = getSessionFromRequest(req);

  clearSessionCookie(res);

  if (session) {
    await registrarAuditoria("logout", session.username, session.role);
  }

  return res.status(200).json({ ok: true });
}

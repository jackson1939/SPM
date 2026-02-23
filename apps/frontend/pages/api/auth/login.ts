// /api/auth/login — Autenticación server-side con cookie httpOnly
import type { NextApiRequest, NextApiResponse } from "next";
import { validateCredentials } from "../../../lib/serverUsers";
import { createSessionToken, setSessionCookie } from "../../../lib/auth";
import { registrarAuditoria } from "../../../lib/auditoria";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }

  const user = validateCredentials(String(username), String(password));

  if (!user) {
    // Pequeño delay para dificultar enumeración de usuarios por timing
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const token = createSessionToken(user.username, user.role, user.nombre);
  setSessionCookie(res, token);

  // Registrar login en auditoría (silencioso si falla)
  await registrarAuditoria("login", user.username, user.role);

  return res.status(200).json({
    role: user.role,
    nombre: user.nombre,
    username: user.username,
  });
}

// POST /api/admin/clear-database — Borrar todos los datos (solo jefe). Irreversible.
import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../../db";
import { requireAuth } from "../../../lib/apiAuth";
import { registrarAuditoria } from "../../../lib/auditoria";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  const session = requireAuth(req, res);
  if (!session) return;
  if (session.role !== "jefe") {
    return res.status(403).json({ error: "Solo el jefe puede borrar la base de datos." });
  }

  const { confirmar } = req.body ?? {};
  if (confirmar !== "BORRAR TODO") {
    return res.status(400).json({
      error: "Debes enviar confirmar: 'BORRAR TODO' en el body para ejecutar esta acción.",
    });
  }

  const db = getDbClient();
  try {
    // Orden: tablas con FK primero, luego productos
    await db.query("DELETE FROM historial_precios");
    await db.query("DELETE FROM ventas");
    await db.query("DELETE FROM compras");
    await db.query("DELETE FROM productos");
    await db.query("DELETE FROM auditoria");
  } catch (err: any) {
    console.error("[clear-database]", err);
    return res.status(500).json({
      error: "Error al vaciar la base de datos",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  try {
    await registrarAuditoria("clear_database", session.username, session.role, null, null, {});
  } catch {
    // Auditoría puede fallar si la tabla se vació
  }

  return res.status(200).json({
    success: true,
    message: "Base de datos vaciada correctamente. Productos, ventas, compras e historial han sido eliminados.",
  });
}

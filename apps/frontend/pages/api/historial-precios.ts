// /api/historial-precios — historial de cambios de precio por producto
import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDbClient();

  if (req.method === "GET") {
    const { producto_id } = req.query;
    if (!producto_id) {
      return res.status(400).json({ error: "producto_id es requerido" });
    }

    try {
      const result = await db.query(
        `SELECT hp.*, p.nombre AS producto_nombre
         FROM historial_precios hp
         JOIN productos p ON hp.producto_id = p.id
         WHERE hp.producto_id = $1
         ORDER BY hp.fecha DESC
         LIMIT 30`,
        [producto_id]
      );
      return res.status(200).json(result.rows);
    } catch (err: any) {
      // Tabla no existe aún → devolver vacío
      if (err.code === "42P01") return res.status(200).json([]);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}

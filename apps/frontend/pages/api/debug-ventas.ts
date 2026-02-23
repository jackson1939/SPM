// /api/debug-ventas — diagnóstico temporal para ver el schema real de la tabla ventas
// SOLO PARA DESARROLLO — se puede eliminar en producción
import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";
import { requireAuth } from "../../lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido. Usa GET." });
  }

  // Solo jefe puede acceder al endpoint de diagnóstico
  const session = requireAuth(req, res, ["jefe"]);
  if (!session) return;

  const db = getDbClient();

  try {
    // 1. Schema completo de la tabla ventas
    const schemaResult = await db.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'ventas' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    // 2. Constraints NOT NULL específicos
    const constraintsResult = await db.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'ventas'
        AND tc.table_schema = 'public'
    `).catch(() => ({ rows: [] }));

    // 3. Cantidad de filas en ventas
    const countResult = await db.query("SELECT COUNT(*) as total FROM ventas").catch(() => ({ rows: [{ total: "error" }] }));

    // 4. Última venta (si existe)
    const lastResult = await db.query("SELECT * FROM ventas ORDER BY id DESC LIMIT 3").catch(() => ({ rows: [] }));

    return res.status(200).json({
      schema: schemaResult.rows,
      constraints: constraintsResult.rows,
      total_ventas: countResult.rows[0]?.total,
      ultimas_ventas: lastResult.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, code: err.code });
  }
}

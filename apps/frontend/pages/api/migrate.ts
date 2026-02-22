// /api/migrate — ejecutar una vez para agregar columnas y tablas nuevas
import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  const db = getDbClient();
  const results: string[] = [];

  const migrations = [
    {
      name: "Agregar columna 'categoria' a productos",
      sql: "ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100)",
    },
    {
      name: "Agregar columna 'notas' a ventas",
      sql: "ALTER TABLE ventas ADD COLUMN IF NOT EXISTS notas TEXT",
    },
    {
      name: "Crear tabla historial_precios",
      sql: `CREATE TABLE IF NOT EXISTS historial_precios (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
        precio_anterior FLOAT NOT NULL,
        precio_nuevo FLOAT NOT NULL,
        fecha TIMESTAMP DEFAULT NOW()
      )`,
    },
    {
      name: "Índice en historial_precios.producto_id",
      sql: "CREATE INDEX IF NOT EXISTS idx_historial_precios_producto_id ON historial_precios(producto_id)",
    },
  ];

  for (const migration of migrations) {
    try {
      await db.query(migration.sql);
      results.push(`✅ ${migration.name}`);
    } catch (err: any) {
      results.push(`❌ ${migration.name}: ${err.message}`);
    }
  }

  return res.status(200).json({ ok: true, results });
}

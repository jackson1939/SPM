// /api/migrate — ejecutar una vez para agregar columnas y tablas nuevas
import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";
import { requireAuth } from "../../lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  // Solo jefe: las migraciones ejecutan DDL; no debe estar disponible para cajero/almacén.
  const session = requireAuth(req, res, ["jefe"]);
  if (!session) return;

  const db = getDbClient();
  const results: string[] = [];

  const migrations = [
    {
      name: "Crear tabla ventas si no existe",
      sql: `CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER,
        cantidad INTEGER NOT NULL DEFAULT 1,
        precio_unitario FLOAT DEFAULT 0,
        total FLOAT NOT NULL DEFAULT 0,
        metodo_pago VARCHAR(50) DEFAULT 'efectivo',
        notas TEXT,
        fecha TIMESTAMP DEFAULT NOW()
      )`,
    },
    {
      name: "Quitar NOT NULL de ventas.producto_id",
      sql: "ALTER TABLE ventas ALTER COLUMN producto_id DROP NOT NULL",
    },
    {
      name: "Quitar NOT NULL de ventas.usuario_id (si existe)",
      sql: `DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'ventas' AND column_name = 'usuario_id'
          ) THEN
            ALTER TABLE ventas ALTER COLUMN usuario_id DROP NOT NULL;
            ALTER TABLE ventas ALTER COLUMN usuario_id SET DEFAULT NULL;
          END IF;
        END
      $$`,
    },
    {
      name: "DEFAULT NOW() en ventas.fecha",
      sql: "ALTER TABLE ventas ALTER COLUMN fecha SET DEFAULT NOW()",
    },
    {
      name: "DEFAULT en ventas.metodo_pago",
      sql: "ALTER TABLE ventas ALTER COLUMN metodo_pago SET DEFAULT 'efectivo'",
    },
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
    {
      name: "Agregar columna 'vendedor_nombre' a ventas",
      sql: "ALTER TABLE ventas ADD COLUMN IF NOT EXISTS vendedor_nombre VARCHAR(50)",
    },
    {
      name: "Crear tabla auditoria",
      sql: `CREATE TABLE IF NOT EXISTS auditoria (
        id SERIAL PRIMARY KEY,
        accion VARCHAR(50) NOT NULL,
        usuario VARCHAR(50) NOT NULL,
        rol VARCHAR(20) NOT NULL,
        entidad VARCHAR(50),
        entidad_id INTEGER,
        detalles JSONB,
        fecha TIMESTAMP DEFAULT NOW()
      )`,
    },
    {
      name: "Índice en auditoria.usuario",
      sql: "CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario)",
    },
    {
      name: "Índice en auditoria.fecha",
      sql: "CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha)",
    },
    {
      name: "Soft delete: agregar deleted_at a productos",
      sql: "ALTER TABLE productos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP",
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

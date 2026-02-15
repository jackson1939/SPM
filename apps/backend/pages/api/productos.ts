import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../../frontend/db";

// GET: obtener todos los productos
// POST: agregar un nuevo producto
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDbClient();
  try {
    if (req.method === "GET") {
      // ✅ MEJORADO: Ahora incluye todos los campos necesarios
      const result = await db.query(`
        SELECT 
          id,
          codigo_barras,
          nombre,
          descripcion,
          precio,
          costo,
          stock,
          stock_minimo,
          categoria_id,
          imagen_url,
          activo,
          created_at,
          updated_at
        FROM productos 
        WHERE activo = true
        ORDER BY nombre ASC
      `);
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { 
        codigo_barras, 
        nombre, 
        descripcion,
        precio,
        costo,
        stock,
        stock_minimo,
        categoria_id,
        imagen_url
      } = req.body;

      // Validación básica
      if (!nombre || precio === undefined || precio === null) {
        return res.status(400).json({ error: "El nombre y precio son requeridos" });
      }

      // ✅ Verificar si el código de barras ya existe (si se proporciona)
      if (codigo_barras) {
        const existente = await db.query(
          "SELECT id FROM productos WHERE codigo_barras = $1",
          [codigo_barras]
        );
        
        if (existente.rows.length > 0) {
          return res.status(409).json({ error: "El código de barras ya existe" });
        }
      }

      // ✅ MEJORADO: Insertar con todos los campos
      const result = await db.query(
        `INSERT INTO productos 
         (codigo_barras, nombre, descripcion, precio, costo, stock, stock_minimo, categoria_id, imagen_url, activo) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) 
         RETURNING *`,
        [
          codigo_barras || null,
          nombre,
          descripcion || null,
          precio,
          costo || 0,
          stock || 0,
          stock_minimo || 5,
          categoria_id || null,
          imagen_url || null
        ]
      );

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en /api/productos:", error);
    return res.status(500).json({ 
      error: "Error interno del servidor",
      message: error.message 
    });
  }
} 
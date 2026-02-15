import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../db";

// GET: obtener todas las compras
// POST: registrar una nueva compra
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const result = await pool.query(
        `SELECT c.id, p.nombre, c.cantidad, c.costo_unitario, c.fecha
         FROM compras c
         JOIN productos p ON c.producto_id = p.id
         ORDER BY c.fecha DESC`
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { producto_id, cantidad, costo_unitario } = req.body;

      if (!producto_id || !cantidad || !costo_unitario) {
        return res.status(400).json({ error: "Datos incompletos" });
      }

      // Verificar producto
      const productoRes = await pool.query("SELECT * FROM productos WHERE id = $1", [producto_id]);
      if (productoRes.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      // Registrar compra
      const compraRes = await pool.query(
        "INSERT INTO compras (producto_id, cantidad, costo_unitario) VALUES ($1, $2, $3) RETURNING *",
        [producto_id, cantidad, costo_unitario]
      );

      // Actualizar stock
      await pool.query("UPDATE productos SET stock = stock + $1 WHERE id = $2", [cantidad, producto_id]);

      return res.status(201).json(compraRes.rows[0]);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
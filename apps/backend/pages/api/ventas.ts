import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../db";

// GET: obtener todas las ventas
// POST: registrar una nueva venta
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const result = await pool.query(
        `SELECT v.id, p.nombre, v.cantidad, v.total, v.fecha
         FROM ventas v
         JOIN productos p ON v.producto_id = p.id
         ORDER BY v.fecha DESC`
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { producto_id, cantidad } = req.body;

      if (!producto_id || !cantidad) {
        return res.status(400).json({ error: "Datos incompletos" });
      }

      // Verificar stock
      const productoRes = await pool.query("SELECT * FROM productos WHERE id = $1", [producto_id]);
      if (productoRes.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const producto = productoRes.rows[0];
      if (producto.stock < cantidad) {
        return res.status(400).json({ error: "Stock insuficiente" });
      }

      const total = producto.precio * cantidad;

      // Registrar venta
      const ventaRes = await pool.query(
        "INSERT INTO ventas (producto_id, cantidad, total) VALUES ($1, $2, $3) RETURNING *",
        [producto_id, cantidad, total]
      );

      // Actualizar stock
      await pool.query("UPDATE productos SET stock = stock - $1 WHERE id = $2", [cantidad, producto_id]);

      return res.status(201).json(ventaRes.rows[0]);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

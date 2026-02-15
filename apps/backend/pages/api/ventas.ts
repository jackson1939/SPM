import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../../frontend/db";

// GET: obtener todas las ventas
// POST: registrar una nueva venta
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDbClient();
  try {
    if (req.method === "GET") {
      // ✅ MEJORADO: Ahora incluye más información
      const result = await db.query(
        `SELECT 
           v.id, 
           v.producto_id,
           p.nombre,
           p.codigo_barras,
           v.cantidad, 
           v.precio_unitario,
           v.total, 
           v.metodo_pago,
           v.fecha,
           v.notas
         FROM ventas v
         JOIN productos p ON v.producto_id = p.id
         ORDER BY v.fecha DESC`
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { producto_id, cantidad, metodo_pago, notas } = req.body;

      // Validaciones
      if (!producto_id || !cantidad) {
        return res.status(400).json({ error: "producto_id y cantidad son requeridos" });
      }

      if (cantidad <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
      }

      // Verificar que el producto existe y tiene stock
      const productoRes = await db.query(
        "SELECT id, nombre, precio, stock FROM productos WHERE id = $1 AND activo = true", 
        [producto_id]
      );

      if (productoRes.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const producto = productoRes.rows[0];

      // Verificar stock suficiente
      if (producto.stock < cantidad) {
        return res.status(400).json({ 
          error: "Stock insuficiente",
          disponible: producto.stock,
          solicitado: cantidad
        });
      }

      const precioUnitario = producto.precio;
      const total = precioUnitario * cantidad;

      // Registrar venta
      const ventaRes = await db.query(
        `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago, notas) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [producto_id, cantidad, precioUnitario, total, metodo_pago || 'efectivo', notas || null]
      );

      // Actualizar stock
      await db.query(
        "UPDATE productos SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", 
        [cantidad, producto_id]
      );

      // ✅ Retornar con información completa
      const ventaCompleta = {
        ...ventaRes.rows[0],
        producto_nombre: producto.nombre
      };

      return res.status(201).json(ventaCompleta);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en /api/ventas:", error);
    return res.status(500).json({ 
      error: "Error interno del servidor",
      message: error.message 
    });
  }
} 
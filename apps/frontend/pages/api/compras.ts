import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";

// GET: obtener todas las compras
// POST: registrar una nueva compra
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getDbClient(); // Get database client (pool or Neon) for this request
    
    if (req.method === "GET") {
      const result = await db.query(
        `SELECT c.id, c.producto_id, p.nombre as producto, c.cantidad, c.costo_unitario, c.fecha
         FROM compras c
         JOIN productos p ON c.producto_id = p.id
         ORDER BY c.fecha DESC`
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { producto_id, cantidad, costo_unitario } = req.body;

      // Validación de datos requeridos
      if (!producto_id || cantidad === undefined || costo_unitario === undefined) {
        return res.status(400).json({ 
          error: "Datos incompletos. Se requieren: producto_id, cantidad y costo_unitario" 
        });
      }

      // Validaciones de tipos y valores
      const cantidadNum = parseInt(cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        return res.status(400).json({ 
          error: "La cantidad debe ser un número positivo mayor a 0" 
        });
      }

      const costoNum = parseFloat(costo_unitario);
      if (isNaN(costoNum) || costoNum < 0) {
        return res.status(400).json({ 
          error: "El costo unitario debe ser un número positivo" 
        });
      }

      // Verificar que el producto existe
      const productoRes = await db.query(
        "SELECT * FROM productos WHERE id = $1",
        [producto_id]
      );
      
      if (productoRes.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      // Registrar compra
      const compraRes = await db.query(
        "INSERT INTO compras (producto_id, cantidad, costo_unitario) VALUES ($1, $2, $3) RETURNING *",
        [producto_id, cantidadNum, costoNum]
      );

      // Actualizar stock del producto
      await db.query(
        "UPDATE productos SET stock = stock + $1 WHERE id = $2",
        [cantidadNum, producto_id]
      );

      // Obtener el nombre del producto para la respuesta
      const compraConProducto = {
        ...compraRes.rows[0],
        producto: productoRes.rows[0].nombre,
      };

      return res.status(201).json(compraConProducto);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en API compras:", error);
    
    // Manejo de errores específicos de PostgreSQL
    if (error.code === "23503") {
      // Violación de foreign key
      return res.status(404).json({ 
        error: "Producto no encontrado" 
      });
    }

    // Log full error for debugging
    console.error("Full error details:", {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });

    return res.status(500).json({ 
      error: "Error interno del servidor",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
      details: process.env.NODE_ENV === "development" ? {
        code: error.code,
        hint: error.hint
      } : undefined
    });
  }
}


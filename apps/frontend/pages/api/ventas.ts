import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";

// GET: obtener todas las ventas
// POST: registrar una nueva venta (actualiza stock)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getDbClient();
    
    if (req.method === "GET") {
      const { fecha, mes, año } = req.query;
      
      let query = `SELECT v.id, v.producto_id, p.nombre as producto, v.cantidad, 
                   v.precio_unitario, v.total, v.metodo_pago, v.fecha
                   FROM ventas v
                   LEFT JOIN productos p ON v.producto_id = p.id`;
      
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (fecha) {
        conditions.push(`DATE(v.fecha) = $${paramIndex}`);
        params.push(fecha);
        paramIndex++;
      }
      
      if (mes && año) {
        conditions.push(`EXTRACT(MONTH FROM v.fecha) = $${paramIndex}`);
        params.push(parseInt(mes as string));
        paramIndex++;
        conditions.push(`EXTRACT(YEAR FROM v.fecha) = $${paramIndex}`);
        params.push(parseInt(año as string));
        paramIndex++;
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY v.fecha DESC`;
      
      const result = await db.query(query, params);
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { items, metodo_pago = "efectivo", monto_pagado } = req.body;

      // Validar que haya items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          error: "Se requiere al menos un producto en la venta" 
        });
      }

      const ventasRegistradas = [];
      let totalVenta = 0;

      // Procesar cada item
      for (const item of items) {
        const { producto_id, cantidad, precio_unitario, nombre } = item;

        // Validaciones
        if (!cantidad || cantidad <= 0) {
          return res.status(400).json({ 
            error: `Cantidad inválida para el producto ${nombre || producto_id}` 
          });
        }

        if (!precio_unitario || precio_unitario < 0) {
          return res.status(400).json({ 
            error: `Precio inválido para el producto ${nombre || producto_id}` 
          });
        }

        const subtotal = cantidad * precio_unitario;
        totalVenta += subtotal;

        // Si es un producto de la BD (no manual), verificar stock y actualizar
        if (producto_id && !String(producto_id).startsWith("MANUAL")) {
          // Verificar que el producto existe y tiene stock
          const productoRes = await db.query(
            "SELECT id, nombre, stock FROM productos WHERE id = $1",
            [producto_id]
          );

          if (productoRes.rows.length === 0) {
            return res.status(404).json({ 
              error: `Producto con ID ${producto_id} no encontrado` 
            });
          }

          const producto = productoRes.rows[0];
          
          if (producto.stock < cantidad) {
            return res.status(400).json({ 
              error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${cantidad}` 
            });
          }

          // Actualizar stock
          await db.query(
            "UPDATE productos SET stock = stock - $1 WHERE id = $2",
            [cantidad, producto_id]
          );

          // Registrar venta en la BD
          const ventaRes = await db.query(
            `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [producto_id, cantidad, precio_unitario, subtotal, metodo_pago]
          );

          ventasRegistradas.push({
            ...ventaRes.rows[0],
            producto: producto.nombre
          });
        } else {
          // Producto manual - solo registrar la venta sin actualizar stock
          // Intentar insertar sin producto_id
          try {
            const ventaRes = await db.query(
              `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago, notas) 
               VALUES (NULL, $1, $2, $3, $4, $5) RETURNING *`,
              [cantidad, precio_unitario, subtotal, metodo_pago, `Producto manual: ${nombre}`]
            );
            ventasRegistradas.push({
              ...ventaRes.rows[0],
              producto: nombre || "Producto manual"
            });
          } catch (err: any) {
            // Si la columna notas no existe, insertar sin ella
            if (err.code === "42703") {
              const ventaRes = await db.query(
                `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago) 
                 VALUES (NULL, $1, $2, $3, $4) RETURNING *`,
                [cantidad, precio_unitario, subtotal, metodo_pago]
              );
              ventasRegistradas.push({
                ...ventaRes.rows[0],
                producto: nombre || "Producto manual"
              });
            } else {
              throw err;
            }
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: "Venta registrada exitosamente",
        ventas: ventasRegistradas,
        total: totalVenta,
        monto_pagado: monto_pagado,
        vuelto: monto_pagado ? monto_pagado - totalVenta : 0
      });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en API ventas:", error);
    
    if (error.code === "42P01") {
      return res.status(500).json({ 
        error: "Error de configuración de base de datos",
        message: process.env.NODE_ENV === "development" ? "La tabla ventas no existe" : undefined
      });
    }

    if (error.code === "23503") {
      return res.status(404).json({ 
        error: "Producto no encontrado" 
      });
    }

    return res.status(500).json({ 
      error: "Error interno del servidor",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

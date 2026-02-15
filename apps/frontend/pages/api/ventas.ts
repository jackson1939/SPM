import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";

// Función auxiliar para intentar insertar venta con diferentes estructuras de tabla
async function insertarVenta(
  db: any,
  producto_id: number | null,
  cantidad: number,
  precio_unitario: number,
  total: number,
  metodo_pago: string,
  nombre?: string
): Promise<any> {
  // Lista de intentos de INSERT, del más completo al más simple
  const intentos = [
    // Intento 1: Estructura completa
    {
      query: `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago) 
              VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      params: [producto_id, cantidad, precio_unitario, total, metodo_pago]
    },
    // Intento 2: Sin metodo_pago
    {
      query: `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total) 
              VALUES ($1, $2, $3, $4) RETURNING *`,
      params: [producto_id, cantidad, precio_unitario, total]
    },
    // Intento 3: Solo campos básicos
    {
      query: `INSERT INTO ventas (producto_id, cantidad, total) 
              VALUES ($1, $2, $3) RETURNING *`,
      params: [producto_id, cantidad, total]
    },
    // Intento 4: Mínimo absoluto
    {
      query: `INSERT INTO ventas (cantidad, total) 
              VALUES ($1, $2) RETURNING *`,
      params: [cantidad, total]
    }
  ];

  let lastError: any = null;
  
  for (const intento of intentos) {
    try {
      const result = await db.query(intento.query, intento.params);
      return result;
    } catch (err: any) {
      lastError = err;
      // Si es error de columna inexistente, probar siguiente intento
      if (err.code === "42703") {
        console.log(`Intento fallido (columna no existe): ${err.message}`);
        continue;
      }
      // Si es otro tipo de error, lanzarlo
      throw err;
    }
  }
  
  // Si ninguno funcionó, lanzar el último error
  throw lastError;
}

// GET: obtener todas las ventas
// POST: registrar una nueva venta (actualiza stock)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getDbClient();
    
    if (req.method === "GET") {
      // Intentar query con JOIN, si falla usar query simple
      try {
        const result = await db.query(
          `SELECT v.*, p.nombre as producto_nombre 
           FROM ventas v 
           LEFT JOIN productos p ON v.producto_id = p.id 
           ORDER BY v.id DESC`
        );
        return res.status(200).json(result.rows);
      } catch (err: any) {
        // Si falla, intentar query simple
        if (err.code === "42703" || err.code === "42P01") {
          try {
            const result = await db.query("SELECT * FROM ventas ORDER BY id DESC");
            return res.status(200).json(result.rows);
          } catch (e) {
            return res.status(200).json([]); // Retornar array vacío si la tabla no existe
          }
        }
        throw err;
      }
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
      let stockActualizadoExitosamente = false;

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
        let productoNombre = nombre || "Producto";

        // Si es un producto de la BD (no manual), actualizar stock
        if (producto_id && !String(producto_id).startsWith("MANUAL")) {
          try {
            // Verificar que el producto existe
            const productoRes = await db.query(
              "SELECT id, nombre, stock FROM productos WHERE id = $1",
              [producto_id]
            );

            if (productoRes.rows.length > 0) {
              const producto = productoRes.rows[0];
              productoNombre = producto.nombre;
              
              // Actualizar stock (esto siempre debería funcionar)
              await db.query(
                "UPDATE productos SET stock = stock - $1 WHERE id = $2",
                [cantidad, producto_id]
              );
              stockActualizadoExitosamente = true;
            }
          } catch (err) {
            console.error("Error al actualizar stock:", err);
          }

          // Intentar registrar venta en la BD (puede fallar si tabla tiene estructura diferente)
          try {
            const ventaRes = await insertarVenta(
              db, producto_id, cantidad, precio_unitario, subtotal, metodo_pago, productoNombre
            );
            ventasRegistradas.push({
              ...ventaRes.rows[0],
              producto: productoNombre
            });
          } catch (err: any) {
            console.error("Error al insertar venta en BD:", err.message);
            // Aunque falle el INSERT, el stock ya se actualizó
            ventasRegistradas.push({
              id: Date.now(),
              producto_id,
              cantidad,
              precio_unitario,
              total: subtotal,
              producto: productoNombre,
              _local: true // Indicador de que no se guardó en BD
            });
          }
        } else {
          // Producto manual
          ventasRegistradas.push({
            id: Date.now(),
            producto_id: null,
            cantidad,
            precio_unitario,
            total: subtotal,
            producto: productoNombre,
            _manual: true
          });
        }
      }

      // Si al menos el stock se actualizó, considerar exitoso
      return res.status(201).json({
        success: true,
        message: stockActualizadoExitosamente 
          ? "Venta registrada y stock actualizado" 
          : "Venta procesada",
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
        error: "La tabla ventas no existe en la base de datos"
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

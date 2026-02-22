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
  const intentos = [
    {
      query: `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago, fecha)
              VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      params: [producto_id, cantidad, precio_unitario, total, metodo_pago]
    },
    {
      query: `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago)
              VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      params: [producto_id, cantidad, precio_unitario, total, metodo_pago]
    },
    {
      query: `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total)
              VALUES ($1, $2, $3, $4) RETURNING *`,
      params: [producto_id, cantidad, precio_unitario, total]
    },
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
      if (err.code === "42703") {
        console.log(`Intento fallido (columna no existe): ${err.message}`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getDbClient();

    // GET: obtener todas las ventas con fecha y nombre de producto
    if (req.method === "GET") {
      try {
        // Query con JOIN para traer nombre del producto y fecha explícita
        const result = await db.query(
          `SELECT
             v.id,
             v.producto_id,
             v.cantidad,
             v.precio_unitario,
             v.total,
             v.metodo_pago,
             v.fecha,
             -- Convertir fecha a ISO string para consistencia de zona horaria
             TO_CHAR(v.fecha AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS fecha_iso,
             COALESCE(p.nombre, 'Producto eliminado') AS producto_nombre
           FROM ventas v
           LEFT JOIN productos p ON v.producto_id = p.id
           ORDER BY v.fecha DESC, v.id DESC`
        );
        // Normalizar respuesta: usar fecha_iso como campo fecha
        const rows = result.rows.map((r: any) => ({
          ...r,
          fecha: r.fecha_iso || r.fecha,
        }));
        return res.status(200).json(rows);
      } catch (err: any) {
        // Fallback 1: sin TO_CHAR (PostgreSQL sin soporte)
        if (err.code === "42883" || err.code === "42703" || err.code === "42601") {
          try {
            const result = await db.query(
              `SELECT v.*, COALESCE(p.nombre, 'Producto eliminado') AS producto_nombre
               FROM ventas v
               LEFT JOIN productos p ON v.producto_id = p.id
               ORDER BY v.fecha DESC, v.id DESC`
            );
            return res.status(200).json(result.rows);
          } catch {
            // Fallback 2: sin JOIN
            try {
              const result = await db.query("SELECT * FROM ventas ORDER BY fecha DESC, id DESC");
              return res.status(200).json(result.rows);
            } catch {
              return res.status(200).json([]);
            }
          }
        }
        throw err;
      }
    }

    // POST: registrar una nueva venta
    if (req.method === "POST") {
      const { items, metodo_pago = "efectivo", monto_pagado } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: "Se requiere al menos un producto en la venta"
        });
      }

      const ventasRegistradas = [];
      const errores: string[] = [];
      let totalVenta = 0;
      let stockActualizadoExitosamente = false;

      for (const item of items) {
        const { producto_id, cantidad, precio_unitario, nombre } = item;

        if (!cantidad || cantidad <= 0) {
          return res.status(400).json({
            error: `Cantidad inválida para: ${nombre || producto_id}`
          });
        }
        if (precio_unitario === undefined || precio_unitario < 0) {
          return res.status(400).json({
            error: `Precio inválido para: ${nombre || producto_id}`
          });
        }

        const subtotal = cantidad * precio_unitario;
        totalVenta += subtotal;
        let productoNombre = nombre || "Producto";

        if (producto_id && !String(producto_id).startsWith("MANUAL")) {
          try {
            const productoRes = await db.query(
              "SELECT id, nombre, stock FROM productos WHERE id = $1",
              [producto_id]
            );

            if (productoRes.rows.length > 0) {
              const producto = productoRes.rows[0];
              productoNombre = producto.nombre;

              await db.query(
                "UPDATE productos SET stock = stock - $1 WHERE id = $2",
                [cantidad, producto_id]
              );
              stockActualizadoExitosamente = true;
            }
          } catch (err) {
            console.error("Error al actualizar stock:", err);
          }

          try {
            const ventaRes = await insertarVenta(
              db, producto_id, cantidad, precio_unitario, subtotal, metodo_pago, productoNombre
            );
            const ventaGuardada = ventaRes.rows[0];
            ventasRegistradas.push({
              ...ventaGuardada,
              producto_nombre: productoNombre,
              // Asegurar que fecha quede en ISO string
              fecha: ventaGuardada.fecha
                ? new Date(ventaGuardada.fecha).toISOString()
                : new Date().toISOString(),
            });
          } catch (err: any) {
            console.error("Error al insertar venta en BD:", err.message);
            errores.push(`${productoNombre}: ${err.message}`);
            ventasRegistradas.push({
              id: Date.now(),
              producto_id,
              cantidad,
              precio_unitario,
              total: subtotal,
              producto_nombre: productoNombre,
              fecha: new Date().toISOString(),
              _local: true
            });
          }
        } else {
          // Producto manual — también intentar guardarlo en ventas
          try {
            const ventaRes = await insertarVenta(
              db, null, cantidad, precio_unitario, subtotal, metodo_pago, productoNombre
            );
            const ventaGuardada = ventaRes.rows[0];
            ventasRegistradas.push({
              ...ventaGuardada,
              producto_nombre: productoNombre,
              fecha: ventaGuardada.fecha
                ? new Date(ventaGuardada.fecha).toISOString()
                : new Date().toISOString(),
              _manual: true
            });
          } catch {
            ventasRegistradas.push({
              id: Date.now(),
              producto_id: null,
              cantidad,
              precio_unitario,
              total: subtotal,
              producto_nombre: productoNombre,
              fecha: new Date().toISOString(),
              _manual: true
            });
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: stockActualizadoExitosamente
          ? "Venta registrada y stock actualizado"
          : "Venta procesada",
        ventas: ventasRegistradas,
        total_ventas: ventasRegistradas.length,
        total: totalVenta,
        monto_pagado: monto_pagado,
        vuelto: monto_pagado ? monto_pagado - totalVenta : 0,
        errores: errores.length > 0 ? errores : undefined
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
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    return res.status(500).json({
      error: "Error interno del servidor",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

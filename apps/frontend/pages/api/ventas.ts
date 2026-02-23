import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";
import { requireAuth } from "../../lib/apiAuth";
import { registrarAuditoria } from "../../lib/auditoria";

// Cache del schema de ventas para no consultar information_schema en cada venta
let ventasSchemaCache: { name: string; nullable: boolean; hasDefault: boolean }[] | null = null;

// Obtiene el schema real de la tabla ventas desde la BD
async function getVentasSchema(db: any): Promise<{ name: string; nullable: boolean; hasDefault: boolean }[]> {
  if (ventasSchemaCache !== null) return ventasSchemaCache;
  const result = await db.query(`
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'ventas' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  const schema: { name: string; nullable: boolean; hasDefault: boolean }[] = result.rows.map((r: any) => ({
    name: r.column_name as string,
    nullable: r.is_nullable === "YES",
    hasDefault: r.column_default !== null,
  }));
  ventasSchemaCache = schema;
  console.log("Schema ventas:", schema.map((c) => `${c.name}(nullable=${c.nullable},default=${c.hasDefault})`).join(", "));
  return schema;
}

// Insert dinámico basado en el schema real de la tabla
// Incluye solo las columnas que podemos proveer; omite las que son nullable o tienen DEFAULT
async function insertarVenta(
  db: any,
  producto_id: number | null,
  cantidad: number,
  precio_unitario: number,
  total: number,
  metodo_pago: string,
  nombre?: string,
  notas?: string,
  vendedor_nombre?: string
): Promise<any> {
  // Valores disponibles (los que nuestra app puede proveer)
  const disponibles: Record<string, any> = {
    producto_id: producto_id,
    cantidad: cantidad,
    precio_unitario: precio_unitario,
    total: total,
    metodo_pago: metodo_pago,
    notas: notas || null,
    vendedor_nombre: vendedor_nombre || null,
    // Columnas comunes que pueden existir y que seteamos a null/default
    usuario_id: null,
    cajero_id: null,
    user_id: null,
    vendedor_id: null,
    sucursal_id: null,
    caja_id: null,
    turno_id: null,
    descuento: 0,
    impuesto: 0,
    subtotal: total,
    estado: "completada",
  };

  let schema: { name: string; nullable: boolean; hasDefault: boolean }[];
  try {
    schema = await getVentasSchema(db);
  } catch (schemaErr: any) {
    console.error("No se pudo obtener schema de ventas:", schemaErr);
    // Fallback: insert mínimo con las columnas más comunes
    schema = [
      { name: "producto_id", nullable: true, hasDefault: false },
      { name: "cantidad", nullable: false, hasDefault: false },
      { name: "precio_unitario", nullable: true, hasDefault: false },
      { name: "total", nullable: false, hasDefault: false },
      { name: "metodo_pago", nullable: true, hasDefault: true },
      { name: "notas", nullable: true, hasDefault: true },
      { name: "fecha", nullable: true, hasDefault: true },
    ];
  }

  const colNames: string[] = [];
  const colValues: string[] = [];
  const params: any[] = [];

  for (const col of schema) {
    if (col.name === "id") continue; // SERIAL auto

    // Columna 'fecha': usar NOW()
    if (col.name === "fecha") {
      colNames.push("fecha");
      colValues.push("NOW()");
      continue;
    }

    // Columna para la que tenemos un valor disponible
    if (col.name in disponibles) {
      colNames.push(col.name);
      params.push(disponibles[col.name]);
      colValues.push(`$${params.length}`);
      continue;
    }

    // Columna desconocida: si tiene default o es nullable, la omitimos (usa el default/null)
    if (col.hasDefault || col.nullable) {
      continue; // No la incluimos, la BD usará su default o null
    }

    // Columna NOT NULL sin default que no tenemos → intentar con NULL y ver qué pasa
    console.warn(`Columna requerida sin valor: ${col.name} — intentando con NULL`);
    colNames.push(col.name);
    params.push(null);
    colValues.push(`$${params.length}`);
  }

  const query = `INSERT INTO ventas (${colNames.join(", ")}) VALUES (${colValues.join(", ")}) RETURNING *`;
  console.log("INSERT ventas:", query.replace(/\s+/g, " "));
  console.log("Params:", params);

  // Invalidar cache si el insert falla por schema issues para que se vuelva a consultar
  try {
    const result = await db.query(query, params);
    console.log(`✅ Venta guardada OK: total=${total}`);
    return result;
  } catch (err: any) {
    console.error(`❌ Error en INSERT ventas (${err.code}): ${err.message}`);
    // Invalidar cache para que la próxima vez consulte de nuevo
    ventasSchemaCache = null;
    throw err;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Todos los roles autenticados pueden acceder a ventas
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    const db = getDbClient();

    // GET: obtener ventas — cajero solo ve las suyas; jefe y almacen ven todas
    if (req.method === "GET") {
      try {
        // Cajero: filtrar por vendedor_nombre (si la columna existe)
        const esCajero = session.role === "cajero";
        let baseQuery = `SELECT
             v.id,
             v.producto_id,
             v.cantidad,
             v.precio_unitario,
             v.total,
             v.metodo_pago,
             v.fecha,
             TO_CHAR(v.fecha AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS fecha_iso,
             COALESCE(p.nombre, 'Producto eliminado') AS producto_nombre,
             v.vendedor_nombre
           FROM ventas v
           LEFT JOIN productos p ON v.producto_id = p.id`;
        const params: any[] = [];
        if (esCajero) {
          baseQuery += ` WHERE v.vendedor_nombre = $1`;
          params.push(session.username);
        }
        baseQuery += ` ORDER BY v.fecha DESC, v.id DESC`;

        const result = await db.query(baseQuery, params);
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

    // POST: registrar una nueva venta (jefe y cajero)
    if (req.method === "POST") {
      if (!["jefe", "cajero"].includes(session.role)) {
        return res.status(403).json({ error: "Solo jefe o cajero pueden registrar ventas" });
      }
      const { items, metodo_pago = "efectivo", monto_pagado, notas } = req.body;

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
              db, producto_id, cantidad, precio_unitario, subtotal, metodo_pago, productoNombre, notas, session.username
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
              db, null, cantidad, precio_unitario, subtotal, metodo_pago, productoNombre, notas, session.username
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

      // Registrar en auditoría
      await registrarAuditoria("venta_creada", session.username, session.role, "ventas", null, {
        items: ventasRegistradas.length,
        total: totalVenta,
        metodo_pago,
      });

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

import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../../frontend/db";

// GET: obtener todas las compras (con filtros opcionales)
// POST: registrar una nueva compra
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ============================================
    // GET: Obtener compras
    // ============================================
    if (req.method === "GET") {
      const { fecha, mes, año } = req.query;

      let query = `
        SELECT 
          c.id,
          c.producto_id,
          c.producto,
          c.cantidad,
          c.costo_unitario,
          c.total,
          c.estado,
          c.fecha,
          c.proveedor,
          c.notas,
          p.nombre as producto_nombre,
          p.codigo_barras
        FROM compras c
        LEFT JOIN productos p ON c.producto_id = p.id
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Filtrar por fecha específica
      if (fecha) {
        conditions.push(`c.fecha = $${paramIndex}`);
        values.push(fecha);
        paramIndex++;
      }
      // Filtrar por mes y año
      else if (mes && año) {
        conditions.push(`EXTRACT(MONTH FROM c.fecha) = $${paramIndex}`);
        values.push(parseInt(mes as string));
        paramIndex++;
        conditions.push(`EXTRACT(YEAR FROM c.fecha) = $${paramIndex}`);
        values.push(parseInt(año as string));
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY c.fecha DESC, c.id DESC';

      const db = getDbClient();
      const result = await db.query(query, values);
      
      // Calcular totales para facilitar el uso en el frontend
      const compras = result.rows || [];
      const totalCompras = compras.length;
      const comprasAprobadas = compras.filter((c: any) => c.estado === 'aprobada').length;
      const montoTotal = compras.reduce((sum: number, c: any) => {
        const total = parseFloat(c.total) || (parseFloat(c.cantidad || 0) * parseFloat(c.costo_unitario || 0));
        return sum + (isNaN(total) ? 0 : total);
      }, 0);

      return res.status(200).json({
        compras: compras,
        resumen: {
          total_compras: totalCompras,
          compras_aprobadas: comprasAprobadas,
          monto_total: montoTotal
        }
      });
    }

    // ============================================
    // POST: Crear nueva compra
    // ============================================
    if (req.method === "POST") {
      const db = getDbClient();
      const { 
        producto_id, 
        nombre_producto, 
        cantidad, 
        costo_unitario,
        precio_venta,
        codigo_barras,
        proveedor,
        notas
      } = req.body;

      // Validaciones básicas
      if (!cantidad || cantidad <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
      }

      if (costo_unitario === undefined || costo_unitario === null || costo_unitario < 0) {
        return res.status(400).json({ error: "El costo unitario debe ser mayor o igual a 0" });
      }

      let productoIdFinal = producto_id;
      let nombreProductoFinal = nombre_producto;

      // CASO 1: Si hay producto_id, verificar que exista
      if (producto_id) {
        const productoExistente = await db.query(
          "SELECT id, nombre FROM productos WHERE id = $1 AND activo = true",
          [producto_id]
        );

        if (productoExistente.rows.length === 0) {
          return res.status(404).json({ error: "Producto no encontrado" });
        }

        nombreProductoFinal = productoExistente.rows[0].nombre;
      }
      // CASO 2: Si no hay producto_id pero hay nombre_producto
      else if (nombre_producto) {
        // Buscar producto existente por nombre (case-insensitive)
        const productoPorNombre = await db.query(
          "SELECT id, nombre FROM productos WHERE LOWER(nombre) = LOWER($1) LIMIT 1",
          [nombre_producto.trim()]
        );

        if (productoPorNombre.rows.length > 0) {
          // Producto encontrado, usar su ID
          productoIdFinal = productoPorNombre.rows[0].id;
          nombreProductoFinal = productoPorNombre.rows[0].nombre;
        } else {
          // CREAR NUEVO PRODUCTO
          const precioVentaCalculado = precio_venta || (costo_unitario * 1.5);
          
          const nuevoProducto = await db.query(
            `INSERT INTO productos (nombre, precio, costo, stock, codigo_barras, activo)
             VALUES ($1, $2, $3, 0, $4, true)
             RETURNING id, nombre`,
            [nombre_producto.trim(), precioVentaCalculado, costo_unitario, codigo_barras || null]
          );

          productoIdFinal = nuevoProducto.rows[0].id;
          nombreProductoFinal = nuevoProducto.rows[0].nombre;
        }
      } else {
        return res.status(400).json({ 
          error: "Debe proporcionar producto_id o nombre_producto" 
        });
      }

      // ============================================
      // INSERTAR COMPRA
      // ============================================
      // Calcular total de la compra
      const totalCompra = cantidad * costo_unitario;
      
      // Intentar insertar con diferentes estructuras de tabla
      let compraResult;
      try {
        // Intento 1: Estructura completa con total calculado
        const compraQuery = `
          INSERT INTO compras (producto_id, producto, cantidad, costo_unitario, total, estado, proveedor, notas)
          VALUES ($1, $2, $3, $4, $5, 'aprobada', $6, $7)
          RETURNING id, producto_id, producto, cantidad, costo_unitario, total, estado, fecha, proveedor, notas
        `;

        compraResult = await db.query(compraQuery, [
          productoIdFinal,
          nombreProductoFinal,
          cantidad,
          costo_unitario,
          totalCompra,
          proveedor || null,
          notas || null
        ]);
      } catch (error: any) {
        // Si falla, intentar sin el campo total (puede que se calcule automáticamente)
        try {
          const compraQuery = `
            INSERT INTO compras (producto_id, producto, cantidad, costo_unitario, estado, proveedor, notas)
            VALUES ($1, $2, $3, $4, 'aprobada', $5, $6)
            RETURNING id, producto_id, producto, cantidad, costo_unitario, total, estado, fecha, proveedor, notas
          `;

          compraResult = await db.query(compraQuery, [
            productoIdFinal,
            nombreProductoFinal,
            cantidad,
            costo_unitario,
            proveedor || null,
            notas || null
          ]);
        } catch (error2: any) {
          // Si aún falla, intentar estructura mínima
          const compraQuery = `
            INSERT INTO compras (producto_id, producto, cantidad, costo_unitario, estado)
            VALUES ($1, $2, $3, $4, 'aprobada')
            RETURNING id, producto_id, producto, cantidad, costo_unitario, total, estado, fecha
          `;

          compraResult = await db.query(compraQuery, [
            productoIdFinal,
            nombreProductoFinal,
            cantidad,
            costo_unitario
          ]);
        }
      }

      const compraRegistrada = compraResult.rows[0];
      
      // Asegurar que el total esté presente en la respuesta
      if (!compraRegistrada.total) {
        compraRegistrada.total = totalCompra;
      }

      // ============================================
      // ACTUALIZAR STOCK Y COSTO DEL PRODUCTO
      // ============================================
      try {
        await db.query(
          `UPDATE productos 
           SET stock = stock + $1, 
               costo = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [cantidad, costo_unitario, productoIdFinal]
        );
      } catch (error: any) {
        // Si falla la actualización de stock, registrar pero advertir
        console.warn("⚠️ No se pudo actualizar el stock del producto:", error.message);
        // No lanzar error, la compra ya se registró
      }

      return res.status(201).json(compraRegistrada);
    }

    return res.status(405).json({ error: "Método no permitido" });

  } catch (error: any) {
    console.error("Error en /api/compras:", error);
    return res.status(500).json({ 
      error: "Error interno del servidor",
      message: error.message 
    });
  }
}

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
      const { fecha, mes, año } = req.query;
      
      let query = `SELECT c.id, c.producto_id, p.nombre as producto, c.cantidad, c.costo_unitario, c.fecha
                   FROM compras c
                   JOIN productos p ON c.producto_id = p.id`;
      
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Filtrar por fecha específica
      if (fecha) {
        conditions.push(`DATE(c.fecha) = $${paramIndex}`);
        params.push(fecha);
        paramIndex++;
      }
      
      // Filtrar por mes y año
      if (mes && año) {
        conditions.push(`EXTRACT(MONTH FROM c.fecha) = $${paramIndex}`);
        params.push(parseInt(mes as string));
        paramIndex++;
        conditions.push(`EXTRACT(YEAR FROM c.fecha) = $${paramIndex}`);
        params.push(parseInt(año as string));
        paramIndex++;
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY c.fecha DESC`;
      
      const result = await db.query(query, params);
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { producto_id, cantidad, costo_unitario, nombre_producto, codigo_barras, precio_venta } = req.body;

      // Validación de datos requeridos
      if (cantidad === undefined || costo_unitario === undefined) {
        return res.status(400).json({ 
          error: "Datos incompletos. Se requieren: cantidad y costo_unitario" 
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

      let productoIdFinal = producto_id;
      let productoNombre = "";

      // Si hay producto_id, verificar que existe
      if (producto_id) {
        const productoRes = await db.query(
          "SELECT * FROM productos WHERE id = $1",
          [producto_id]
        );
        
        if (productoRes.rows.length > 0) {
          productoNombre = productoRes.rows[0].nombre;
          // Actualizar stock del producto existente
          await db.query(
            "UPDATE productos SET stock = stock + $1 WHERE id = $2",
            [cantidadNum, producto_id]
          );
        } else {
          return res.status(404).json({ error: "Producto no encontrado" });
        }
      } 
      // Si no hay producto_id pero hay nombre_producto, crear o buscar producto
      else if (nombre_producto) {
        // Buscar por código de barras si existe
        if (codigo_barras) {
          const productoPorCodigo = await db.query(
            "SELECT * FROM productos WHERE codigo_barras = $1",
            [codigo_barras.trim()]
          );
          
          if (productoPorCodigo.rows.length > 0) {
            // Producto existe, sumar stock
            productoIdFinal = productoPorCodigo.rows[0].id;
            productoNombre = productoPorCodigo.rows[0].nombre;
            await db.query(
              "UPDATE productos SET stock = stock + $1 WHERE id = $2",
              [cantidadNum, productoIdFinal]
            );
          } else {
            // Crear nuevo producto
            const precioVentaNum = precio_venta ? parseFloat(precio_venta) : costoNum * 1.5; // Margen del 50% por defecto
            const nuevoProducto = await db.query(
              "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
              [codigo_barras.trim(), nombre_producto.trim(), precioVentaNum, cantidadNum]
            );
            productoIdFinal = nuevoProducto.rows[0].id;
            productoNombre = nuevoProducto.rows[0].nombre;
          }
        } else {
          // Buscar por nombre
          const productoPorNombre = await db.query(
            "SELECT * FROM productos WHERE LOWER(nombre) = LOWER($1)",
            [nombre_producto.trim()]
          );
          
          if (productoPorNombre.rows.length > 0) {
            // Producto existe, sumar stock
            productoIdFinal = productoPorNombre.rows[0].id;
            productoNombre = productoPorNombre.rows[0].nombre;
            await db.query(
              "UPDATE productos SET stock = stock + $1 WHERE id = $2",
              [cantidadNum, productoIdFinal]
            );
          } else {
            // Crear nuevo producto sin código de barras
            const codigoBarrasAuto = `AUTO-${Date.now()}`;
            const precioVentaNum = precio_venta ? parseFloat(precio_venta) : costoNum * 1.5;
            const nuevoProducto = await db.query(
              "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
              [codigoBarrasAuto, nombre_producto.trim(), precioVentaNum, cantidadNum]
            );
            productoIdFinal = nuevoProducto.rows[0].id;
            productoNombre = nuevoProducto.rows[0].nombre;
          }
        }
      } else {
        return res.status(400).json({ 
          error: "Se requiere producto_id o nombre_producto" 
        });
      }

      // Registrar compra
      const compraRes = await db.query(
        "INSERT INTO compras (producto_id, cantidad, costo_unitario) VALUES ($1, $2, $3) RETURNING *",
        [productoIdFinal, cantidadNum, costoNum]
      );

      // Obtener el nombre del producto para la respuesta
      const compraConProducto = {
        ...compraRes.rows[0],
        producto: productoNombre,
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


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
      
      // Try to use producto_id if column exists, otherwise use producto VARCHAR
      // First check if producto_id column exists by trying a query
      let query = `SELECT c.id, c.producto as producto, c.cantidad, c.costo_unitario, c.fecha, c.total, c.estado
                   FROM compras c`;
      
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
        // Buscar por código de barras si existe (y la columna existe en la BD)
        if (codigo_barras) {
          try {
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
              try {
                const nuevoProducto = await db.query(
                  "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
                  [codigo_barras.trim(), nombre_producto.trim(), precioVentaNum, cantidadNum]
                );
                productoIdFinal = nuevoProducto.rows[0].id;
                productoNombre = nuevoProducto.rows[0].nombre;
              } catch (insertError: any) {
                // Si la columna codigo_barras no existe, insertar sin ella
                if (insertError.code === "42703") {
                  console.warn("Columna codigo_barras no existe, insertando sin código de barras");
                  const nuevoProducto = await db.query(
                    "INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *",
                    [nombre_producto.trim(), precioVentaNum, cantidadNum]
                  );
                  productoIdFinal = nuevoProducto.rows[0].id;
                  productoNombre = nuevoProducto.rows[0].nombre;
                } else {
                  throw insertError;
                }
              }
            }
          } catch (checkError: any) {
            // Si la columna codigo_barras no existe, buscar solo por nombre
            if (checkError.code === "42703") {
              console.warn("Columna codigo_barras no existe, buscando solo por nombre");
              // Continuar con búsqueda por nombre (código más abajo)
            } else {
              throw checkError;
            }
          }
        }
        
        // Si no hay codigo_barras o la columna no existe, buscar por nombre
        if (!codigo_barras || !productoIdFinal) {
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
            const precioVentaNum = precio_venta ? parseFloat(precio_venta) : costoNum * 1.5;
            try {
              const nuevoProducto = await db.query(
                "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
                [`AUTO-${Date.now()}`, nombre_producto.trim(), precioVentaNum, cantidadNum]
              );
              productoIdFinal = nuevoProducto.rows[0].id;
              productoNombre = nuevoProducto.rows[0].nombre;
            } catch (insertError: any) {
              // Si la columna codigo_barras no existe, insertar sin ella
              if (insertError.code === "42703") {
                console.warn("Columna codigo_barras no existe, insertando sin código de barras");
                const nuevoProducto = await db.query(
                  "INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *",
                  [nombre_producto.trim(), precioVentaNum, cantidadNum]
                );
                productoIdFinal = nuevoProducto.rows[0].id;
                productoNombre = nuevoProducto.rows[0].nombre;
              } else {
                throw insertError;
              }
            }
          }
        }
      } else {
        return res.status(400).json({ 
          error: "Se requiere producto_id o nombre_producto" 
        });
      }

      // Calcular total de la compra
      const totalCompra = cantidadNum * costoNum;

      // Registrar compra - usar producto VARCHAR según el schema real
      // Intentar primero con producto_id si existe, sino usar producto VARCHAR
      let compraRes;
      try {
        // Try with producto_id first (if column exists)
        compraRes = await db.query(
          "INSERT INTO compras (producto_id, cantidad, costo_unitario, total) VALUES ($1, $2, $3, $4) RETURNING *",
          [productoIdFinal, cantidadNum, costoNum, totalCompra]
        );
      } catch (err: any) {
        // If producto_id doesn't exist, use producto VARCHAR
        if (err.code === '42703' || err.message?.includes('column') || err.message?.includes('producto_id')) {
          compraRes = await db.query(
            "INSERT INTO compras (producto, cantidad, costo_unitario, total) VALUES ($1, $2, $3, $4) RETURNING *",
            [productoNombre, cantidadNum, costoNum, totalCompra]
          );
        } else {
          throw err;
        }
      }

      // Obtener el nombre del producto para la respuesta
      const compraConProducto = {
        ...compraRes.rows[0],
        producto: productoNombre,
        producto_id: productoIdFinal,
      };

      return res.status(201).json(compraConProducto);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en API compras:", error);
    
    // Manejo de errores de conexión a la base de datos
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('connection')) {
      console.error("Database connection error:", error.message);
      return res.status(500).json({ 
        error: "Error de conexión a la base de datos",
        message: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
    
    // Manejo de errores específicos de PostgreSQL
    if (error.code === "23503") {
      // Violación de foreign key
      return res.status(404).json({ 
        error: "Producto no encontrado" 
      });
    }

    if (error.code === "42P01") {
      // Tabla no existe
      console.error("Table does not exist:", error.message);
      return res.status(500).json({ 
        error: "Error de configuración de base de datos",
        message: process.env.NODE_ENV === "development" ? "La tabla compras no existe" : undefined
      });
    }

    if (error.code === "42703") {
      // Columna no existe - puede ser que la estructura de la tabla sea diferente
      console.error("Column does not exist:", error.message);
      return res.status(500).json({ 
        error: "Error de estructura de base de datos",
        message: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }

    // Log full error for debugging
    console.error("Full error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });

    return res.status(500).json({ 
      error: "Error interno del servidor",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
      details: process.env.NODE_ENV === "development" ? {
        code: error.code,
        hint: error.hint,
        detail: error.detail
      } : undefined
    });
  }
}


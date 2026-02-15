import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db"; // conexión a Neon/Postgres

// GET: obtener todos los productos
// POST: agregar un nuevo producto
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getDbClient(); // Get database client (pool or Neon) for this request
    
    if (req.method === "GET") {
      try {
        const result = await db.query(
          "SELECT * FROM productos ORDER BY id ASC"
        );
        // Convertir precio y stock a números (PostgreSQL DECIMAL se devuelve como string)
        const productosFormateados = result.rows.map((p: any) => ({
          ...p,
          precio: typeof p.precio === 'string' ? parseFloat(p.precio) : p.precio,
          stock: typeof p.stock === 'string' ? parseInt(p.stock) : p.stock,
          // Si codigo_barras no existe, usar un valor por defecto
          codigo_barras: p.codigo_barras || `AUTO-${p.id}`
        }));
        return res.status(200).json(productosFormateados);
      } catch (queryError: any) {
        console.error("Error executing productos GET query:", queryError);
        console.error("Query error details:", {
          message: queryError.message,
          code: queryError.code,
          detail: queryError.detail
        });
        throw queryError;
      }
    }

    if (req.method === "POST") {
      const { codigo_barras, nombre, precio, stock } = req.body;

      // Validación de datos requeridos (codigo_barras es opcional)
      if (!nombre || precio === undefined || precio === null) {
        return res.status(400).json({ 
          error: "Datos incompletos. Se requieren: nombre y precio" 
        });
      }

      // Validaciones de tipos y valores
      if (typeof nombre !== "string" || nombre.trim().length === 0) {
        return res.status(400).json({ 
          error: "El nombre debe ser un texto válido" 
        });
      }

      const precioNum = parseFloat(precio);
      if (isNaN(precioNum) || precioNum < 0) {
        return res.status(400).json({ 
          error: "El precio debe ser un número positivo" 
        });
      }

      const stockNum = stock !== undefined && stock !== null 
        ? parseInt(stock) 
        : 0;
      
      if (isNaN(stockNum) || stockNum < 0) {
        return res.status(400).json({ 
          error: "El stock debe ser un número positivo" 
        });
      }

      // Validar que el código de barras no exista (solo si se proporciona y la columna existe)
      if (codigo_barras && typeof codigo_barras === "string" && codigo_barras.trim().length > 0) {
        try {
          const existingProduct = await db.query(
            "SELECT id FROM productos WHERE codigo_barras = $1",
            [codigo_barras.trim()]
          );

          if (existingProduct.rows.length > 0) {
            return res.status(409).json({ 
              error: "El código de barras ya existe" 
            });
          }
        } catch (checkError: any) {
          // Si la columna codigo_barras no existe (error 42703), continuar sin validar
          if (checkError.code !== "42703") {
            throw checkError;
          }
          // Si la columna no existe, simplemente no validamos el código de barras
          console.warn("Columna codigo_barras no existe, omitiendo validación");
        }
      }

      // Insertar nuevo producto - intentar sin codigo_barras primero (ya que la columna no existe)
      // Si codigo_barras está disponible, intentar con él, pero si falla, usar sin él
      let result;
      try {
        // Primero intentar sin codigo_barras (más seguro)
        result = await db.query(
          "INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *",
          [nombre.trim(), precioNum, stockNum]
        );
      } catch (insertError: any) {
        // Si falla por otra razón que no sea codigo_barras, lanzar el error
        if (insertError.code !== "42703") {
          throw insertError;
        }
        // Si es error de columna, intentar con codigo_barras (aunque probablemente también falle)
        // Pero esto es un fallback
        if (codigo_barras && typeof codigo_barras === "string" && codigo_barras.trim().length > 0) {
          result = await db.query(
            "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
            [codigo_barras.trim(), nombre.trim(), precioNum, stockNum]
          );
        } else {
          throw insertError;
        }
      }

      // Formatear la respuesta para asegurar tipos correctos
      const producto = result.rows[0];
      const productoFormateado = {
        ...producto,
        precio: typeof producto.precio === 'string' ? parseFloat(producto.precio) : producto.precio,
        stock: typeof producto.stock === 'string' ? parseInt(producto.stock) : producto.stock,
        codigo_barras: producto.codigo_barras || `AUTO-${producto.id}`
      };

      return res.status(201).json(productoFormateado);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en API productos:", error);
    
    // Manejo de errores de conexión a la base de datos
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('connection')) {
      console.error("Database connection error:", error.message);
      return res.status(500).json({ 
        error: "Error de conexión a la base de datos",
        message: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
    
    // Manejo de errores específicos de PostgreSQL
    if (error.code === "23505") {
      // Violación de constraint único
      return res.status(409).json({ 
        error: "El código de barras ya existe" 
      });
    }

    if (error.code === "23502") {
      // Violación de NOT NULL
      return res.status(400).json({ 
        error: "Faltan campos requeridos" 
      });
    }

    if (error.code === "42P01") {
      // Tabla no existe
      console.error("Table does not exist:", error.message);
      return res.status(500).json({ 
        error: "Error de configuración de base de datos",
        message: process.env.NODE_ENV === "development" ? "La tabla productos no existe" : undefined
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


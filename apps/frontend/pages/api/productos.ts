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
      const result = await db.query(
        "SELECT * FROM productos ORDER BY id ASC"
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { codigo_barras, nombre, precio, stock } = req.body;

      // Validación de datos requeridos
      if (!codigo_barras || !nombre || precio === undefined || precio === null) {
        return res.status(400).json({ 
          error: "Datos incompletos. Se requieren: codigo_barras, nombre y precio" 
        });
      }

      // Validaciones de tipos y valores
      if (typeof codigo_barras !== "string" || codigo_barras.trim().length === 0) {
        return res.status(400).json({ 
          error: "El código de barras debe ser un texto válido" 
        });
      }

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

      // Validar que el código de barras no exista
      const existingProduct = await db.query(
        "SELECT id FROM productos WHERE codigo_barras = $1",
        [codigo_barras.trim()]
      );

      if (existingProduct.rows.length > 0) {
        return res.status(409).json({ 
          error: "El código de barras ya existe" 
        });
      }

      // Insertar nuevo producto
      const result = await db.query(
        "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
        [codigo_barras.trim(), nombre.trim(), precioNum, stockNum]
      );

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en API productos:", error);
    
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


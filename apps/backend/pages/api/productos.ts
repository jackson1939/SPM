import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../db"; // conexión a Neon/Postgres

// GET: obtener todos los productos
// POST: agregar un nuevo producto
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const result = await pool.query("SELECT * FROM productos ORDER BY id ASC");
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { codigo_barras, nombre, precio, stock } = req.body;

      if (!codigo_barras || !nombre || !precio) {
        return res.status(400).json({ error: "Datos incompletos" });
      }

      const result = await pool.query(
        "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
        [codigo_barras, nombre, precio, stock || 0]
      );

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../db";

// GET: obtener resumen de reportes
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Total de ventas
      const ventasRes = await pool.query("SELECT COALESCE(SUM(total),0) AS total_ventas FROM ventas");

      // Total de compras
      const comprasRes = await pool.query("SELECT COALESCE(SUM(cantidad * costo_unitario),0) AS total_compras FROM compras");

      // Stock actual por producto
      const stockRes = await pool.query("SELECT nombre, stock FROM productos ORDER BY nombre ASC");

      const reportes = {
        total_ventas: ventasRes.rows[0].total_ventas,
        total_compras: comprasRes.rows[0].total_compras,
        stock: stockRes.rows,
      };

      return res.status(200).json(reportes);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../../frontend/db";

// GET: obtener resumen de reportes
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // ✅ Total de ventas
      const db = getDbClient();
      const ventasRes = await db.query(
        "SELECT COALESCE(SUM(total), 0) AS total_ventas FROM ventas"
      );

      // ✅ Total de compras
      const comprasRes = await db.query(`
        SELECT 
          COALESCE(SUM(total), 0) AS total_compras,
          COALESCE(COUNT(*), 0) AS num_compras
        FROM compras 
        WHERE estado = 'aprobada'
      `);

      // ✅ Stock actual por producto (con alertas de bajo stock)
      const stockRes = await db.query(`
        SELECT 
          id,
          nombre, 
          codigo_barras,
          stock,
          stock_minimo,
          precio,
          costo,
          (stock <= stock_minimo) as bajo_stock
        FROM productos 
        WHERE activo = true
        ORDER BY nombre ASC
      `);

      // ✅ Productos con bajo stock
      const bajoStockRes = await db.query(`
        SELECT 
          id,
          nombre,
          codigo_barras,
          stock,
          stock_minimo,
          (stock_minimo - stock) as unidades_faltantes
        FROM productos
        WHERE activo = true AND stock <= stock_minimo
        ORDER BY (stock_minimo - stock) DESC
      `);

      // ✅ Productos más vendidos (últimos 30 días)
      const masVendidosRes = await db.query(`
        SELECT 
          p.id,
          p.nombre,
          p.codigo_barras,
          SUM(v.cantidad) as total_vendido,
          SUM(v.total) as ingresos_totales,
          COUNT(v.id) as num_ventas
        FROM productos p
        JOIN ventas v ON p.id = v.producto_id
        WHERE v.fecha >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.id, p.nombre, p.codigo_barras
        ORDER BY total_vendido DESC
        LIMIT 10
      `);

      // ✅ Ventas por día (últimos 7 días)
      const ventasPorDiaRes = await db.query(`
        SELECT 
          DATE(fecha) as fecha,
          COUNT(*) as num_ventas,
          SUM(total) as total_dia,
          SUM(cantidad) as unidades_vendidas
        FROM ventas
        WHERE fecha >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(fecha)
        ORDER BY fecha DESC
      `);

      const reportes = {
        resumen: {
          total_ventas: parseFloat(ventasRes.rows[0].total_ventas),
          total_compras: parseFloat(comprasRes.rows[0].total_compras),
          num_compras: parseInt(comprasRes.rows[0].num_compras),
          ganancia_bruta: parseFloat(ventasRes.rows[0].total_ventas) - parseFloat(comprasRes.rows[0].total_compras),
        },
        stock: stockRes.rows,
        productos_bajo_stock: bajoStockRes.rows,
        productos_mas_vendidos: masVendidosRes.rows,
        ventas_por_dia: ventasPorDiaRes.rows,
      };

      return res.status(200).json(reportes);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en /api/reportes:", error);
    return res.status(500).json({ 
      error: "Error interno del servidor",
      message: error.message 
    });
  }
}
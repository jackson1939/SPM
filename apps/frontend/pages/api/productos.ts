import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getDbClient();

    // GET: obtener todos los productos
    if (req.method === "GET") {
      const result = await db.query(
        "SELECT * FROM productos ORDER BY id ASC"
      );
      const productosFormateados = result.rows.map((p: any) => ({
        ...p,
        precio: typeof p.precio === "string" ? parseFloat(p.precio) : p.precio,
        stock: typeof p.stock === "string" ? parseInt(p.stock) : p.stock,
        // Solo mostrar AUTO- si realmente no tiene código de barras
        codigo_barras: p.codigo_barras && p.codigo_barras.trim() !== "" ? p.codigo_barras : null,
      }));
      return res.status(200).json(productosFormateados);
    }

    // POST: crear nuevo producto
    if (req.method === "POST") {
      const { codigo_barras, nombre, precio, stock } = req.body;

      if (!nombre || precio === undefined || precio === null) {
        return res.status(400).json({
          error: "Datos incompletos. Se requieren: nombre y precio",
        });
      }

      if (typeof nombre !== "string" || nombre.trim().length === 0) {
        return res.status(400).json({ error: "El nombre debe ser un texto válido" });
      }

      const precioNum = parseFloat(precio);
      if (isNaN(precioNum) || precioNum < 0) {
        return res.status(400).json({ error: "El precio debe ser un número positivo" });
      }

      const stockNum =
        stock !== undefined && stock !== null ? parseInt(stock) : 0;
      if (isNaN(stockNum) || stockNum < 0) {
        return res.status(400).json({ error: "El stock debe ser un número positivo" });
      }

      const codigoLimpio =
        codigo_barras && typeof codigo_barras === "string" && codigo_barras.trim().length > 0
          ? codigo_barras.trim()
          : null;

      // Validar unicidad del código de barras si se proporcionó
      if (codigoLimpio) {
        const existing = await db.query(
          "SELECT id FROM productos WHERE codigo_barras = $1",
          [codigoLimpio]
        );
        if (existing.rows.length > 0) {
          return res.status(409).json({ error: "El código de barras ya existe" });
        }
      }

      // Insertar producto con o sin código de barras
      let result;
      if (codigoLimpio) {
        result = await db.query(
          "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
          [codigoLimpio, nombre.trim(), precioNum, stockNum]
        );
      } else {
        result = await db.query(
          "INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *",
          [nombre.trim(), precioNum, stockNum]
        );
      }

      const producto = result.rows[0];
      return res.status(201).json({
        ...producto,
        precio: typeof producto.precio === "string" ? parseFloat(producto.precio) : producto.precio,
        stock: typeof producto.stock === "string" ? parseInt(producto.stock) : producto.stock,
        codigo_barras: producto.codigo_barras && producto.codigo_barras.trim() !== "" ? producto.codigo_barras : null,
      });
    }

    // DELETE: eliminar producto por id (query param)
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Se requiere el ID del producto" });
      }

      const idNum = parseInt(id as string);
      if (isNaN(idNum)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      // Verificar que el producto existe
      const existing = await db.query("SELECT id FROM productos WHERE id = $1", [idNum]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      await db.query("DELETE FROM productos WHERE id = $1", [idNum]);
      return res.status(200).json({ success: true, message: "Producto eliminado correctamente" });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en API productos:", error);

    if (error.code === "23505") {
      return res.status(409).json({ error: "El código de barras ya existe" });
    }
    if (error.code === "23503") {
      return res.status(409).json({
        error: "No se puede eliminar el producto porque tiene ventas o compras asociadas",
      });
    }
    if (error.code === "42P01") {
      return res.status(500).json({ error: "Error de configuración de base de datos" });
    }

    return res.status(500).json({
      error: "Error interno del servidor",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

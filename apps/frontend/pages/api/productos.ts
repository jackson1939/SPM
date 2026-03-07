import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";
import { requireAuth } from "../../lib/apiAuth";
import { registrarAuditoria } from "../../lib/auditoria";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar autenticación — todos los roles pueden leer; solo jefe/almacen pueden escribir
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    const db = getDbClient();

    // GET: obtener todos los productos (o uno por codigo_barras)
    if (req.method === "GET") {
      const { codigo_barras: codigoQuery } = req.query;
      const codigoBarras = typeof codigoQuery === "string" && codigoQuery.trim() ? codigoQuery.trim() : null;

      let result;
      if (codigoBarras) {
        try {
          result = await db.query(
            "SELECT * FROM productos WHERE codigo_barras = $1 AND (deleted_at IS NULL) ORDER BY id ASC",
            [codigoBarras]
          );
        } catch (colErr: any) {
          if (colErr.code === "42703") {
            result = await db.query("SELECT * FROM productos WHERE codigo_barras = $1 ORDER BY id ASC", [codigoBarras]);
          } else throw colErr;
        }
      } else {
        try {
          result = await db.query(
            "SELECT * FROM productos WHERE (deleted_at IS NULL) ORDER BY id ASC"
          );
        } catch (colErr: any) {
          if (colErr.code === "42703") {
            result = await db.query("SELECT * FROM productos ORDER BY id ASC");
          } else throw colErr;
        }
      }

      const productosFormateados = result.rows.map((p: any) => ({
        ...p,
        precio: typeof p.precio === "string" ? parseFloat(p.precio) : p.precio,
        stock: typeof p.stock === "string" ? parseInt(p.stock) : p.stock,
        codigo_barras: p.codigo_barras && p.codigo_barras.trim() !== "" ? p.codigo_barras : null,
        categoria: p.categoria || null,
      }));
      return res.status(200).json(productosFormateados);
    }

    // POST: crear nuevo producto (jefe y almacen)
    if (req.method === "POST") {
      if (!["jefe", "almacen"].includes(session.role)) {
        return res.status(403).json({ error: "Solo jefe o almacén pueden crear productos" });
      }
      const { codigo_barras, nombre, precio, stock, categoria } = req.body;

      if (!nombre || precio === undefined || precio === null) {
        return res.status(400).json({
          error: "Datos incompletos. Se requieren: nombre y precio",
        });
      }

      if (typeof nombre !== "string" || nombre.trim().length === 0) {
        return res.status(400).json({ error: "El nombre debe ser un texto válido" });
      }

      const precioNum = Math.round(Number(precio));
      if (isNaN(precioNum) || precioNum < 0) {
        return res.status(400).json({ error: "El precio debe ser un número entero positivo" });
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

      const categoriaLimpia =
        categoria && typeof categoria === "string" && categoria.trim().length > 0
          ? categoria.trim()
          : null;

      // Validar unicidad del código de barras
      if (codigoLimpio) {
        const existing = await db.query(
          "SELECT id FROM productos WHERE codigo_barras = $1",
          [codigoLimpio]
        );
        if (existing.rows.length > 0) {
          return res.status(409).json({ error: "El código de barras ya existe" });
        }
      }

      let result;
      try {
        if (codigoLimpio) {
          result = await db.query(
            `INSERT INTO productos (codigo_barras, nombre, precio, stock, categoria)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [codigoLimpio, nombre.trim(), precioNum, stockNum, categoriaLimpia]
          );
        } else {
          result = await db.query(
            `INSERT INTO productos (nombre, precio, stock, categoria)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nombre.trim(), precioNum, stockNum, categoriaLimpia]
          );
        }
      } catch (insertErr: any) {
        if (insertErr.code === "42703") {
          // La columna 'categoria' no existe aún — reintentar sin ella
          console.log("Columna 'categoria' no existe, reintentando sin ella...");
          if (codigoLimpio) {
            result = await db.query(
              `INSERT INTO productos (codigo_barras, nombre, precio, stock)
               VALUES ($1, $2, $3, $4) RETURNING *`,
              [codigoLimpio, nombre.trim(), precioNum, stockNum]
            );
          } else {
            result = await db.query(
              `INSERT INTO productos (nombre, precio, stock)
               VALUES ($1, $2, $3) RETURNING *`,
              [nombre.trim(), precioNum, stockNum]
            );
          }
        } else {
          throw insertErr;
        }
      }

      const producto = result.rows[0];
      await registrarAuditoria("producto_creado", session.username, session.role, "productos", producto.id, { nombre: producto.nombre });
      return res.status(201).json({
        ...producto,
        precio: typeof producto.precio === "string" ? parseFloat(producto.precio) : producto.precio,
        stock: typeof producto.stock === "string" ? parseInt(producto.stock) : producto.stock,
        codigo_barras: producto.codigo_barras && producto.codigo_barras.trim() !== "" ? producto.codigo_barras : null,
        categoria: producto.categoria || null,
      });
    }

    // PUT: actualizar producto por id (jefe y almacen)
    if (req.method === "PUT") {
      if (!["jefe", "almacen"].includes(session.role)) {
        return res.status(403).json({ error: "Solo jefe o almacén pueden editar productos" });
      }
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Se requiere el ID del producto" });
      }

      const idNum = parseInt(id as string);
      if (isNaN(idNum)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const { nombre, precio, stock, codigo_barras, categoria } = req.body;

      // Verificar que el producto existe y obtener precio actual
      const current = await db.query(
        "SELECT * FROM productos WHERE id = $1",
        [idNum]
      );
      if (current.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const productoActual = current.rows[0];
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (precio !== undefined) {
        const precioNum = Math.round(Number(precio));
        if (isNaN(precioNum) || precioNum < 0) {
          return res.status(400).json({ error: "El precio debe ser un número entero positivo" });
        }
        updates.push(`precio = $${paramCount++}`);
        values.push(precioNum);
      }

      if (stock !== undefined) {
        const stockNum = parseInt(stock);
        if (isNaN(stockNum) || stockNum < 0) {
          return res.status(400).json({ error: "El stock debe ser un número positivo" });
        }
        updates.push(`stock = $${paramCount++}`);
        values.push(stockNum);
      }

      if (nombre !== undefined) {
        if (typeof nombre !== "string" || nombre.trim().length === 0) {
          return res.status(400).json({ error: "El nombre debe ser un texto válido" });
        }
        updates.push(`nombre = $${paramCount++}`);
        values.push(nombre.trim());
      }

      if (categoria !== undefined) {
        const catLimpia = categoria && categoria.trim() ? categoria.trim() : null;
        updates.push(`categoria = $${paramCount++}`);
        values.push(catLimpia);
      }

      if (codigo_barras !== undefined) {
        const codigoLimpio = codigo_barras && codigo_barras.trim() ? codigo_barras.trim() : null;
        // Verificar unicidad si cambió
        if (codigoLimpio && codigoLimpio !== productoActual.codigo_barras) {
          const dup = await db.query(
            "SELECT id FROM productos WHERE codigo_barras = $1 AND id != $2",
            [codigoLimpio, idNum]
          );
          if (dup.rows.length > 0) {
            return res.status(409).json({ error: "El código de barras ya existe" });
          }
        }
        updates.push(`codigo_barras = $${paramCount++}`);
        values.push(codigoLimpio);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No hay campos para actualizar" });
      }

      values.push(idNum);
      let result;
      try {
        result = await db.query(
          `UPDATE productos SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
          values
        );
      } catch (updateErr: any) {
        if (updateErr.code === "42703") {
          // Alguna columna no existe (ej: categoria) — filtrarla y reintentar
          const updatesLimpios: string[] = [];
          const valuesLimpios: any[] = [];
          let pIdx = 1;
          updates.forEach((u, i) => {
            if (!u.includes("categoria")) {
              updatesLimpios.push(`${u.split(" = ")[0]} = $${pIdx++}`);
              valuesLimpios.push(values[i]);
            }
          });
          if (updatesLimpios.length === 0) {
            throw updateErr;
          }
          valuesLimpios.push(idNum);
          result = await db.query(
            `UPDATE productos SET ${updatesLimpios.join(", ")} WHERE id = $${pIdx} RETURNING *`,
            valuesLimpios
          );
        } else {
          throw updateErr;
        }
      }

      // Registrar historial de precio si cambió
      if (precio !== undefined) {
        const precioAnterior = parseFloat(productoActual.precio);
        const precioNuevo = parseFloat(precio);
        if (precioAnterior !== precioNuevo) {
          try {
            await db.query(
              "INSERT INTO historial_precios (producto_id, precio_anterior, precio_nuevo) VALUES ($1, $2, $3)",
              [idNum, precioAnterior, precioNuevo]
            );
          } catch {
            // Tabla puede no existir todavía — ignorar silenciosamente
          }
        }
      }

      const p = result.rows[0];
      await registrarAuditoria("producto_editado", session.username, session.role, "productos", idNum, { nombre: p.nombre });
      return res.status(200).json({
        ...p,
        precio: parseFloat(p.precio),
        stock: parseInt(p.stock),
        codigo_barras: p.codigo_barras && p.codigo_barras.trim() !== "" ? p.codigo_barras : null,
        categoria: p.categoria || null,
      });
    }

    // DELETE: eliminar producto (solo jefe)
    if (req.method === "DELETE") {
      if (session.role !== "jefe") {
        return res.status(403).json({ error: "Solo el jefe puede eliminar productos" });
      }
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Se requiere el ID del producto" });
      }

      const idNum = parseInt(id as string);
      if (isNaN(idNum)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const existing = await db.query("SELECT id, nombre FROM productos WHERE id = $1", [idNum]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const delRow = existing.rows[0];
      // Siempre soft delete: el producto deja de verse en Productos/Almacén pero sigue en reportes/ventas
      try {
        await db.query("UPDATE productos SET deleted_at = NOW() WHERE id = $1", [idNum]);
      } catch (softErr: any) {
        if (softErr.code === "42703") {
          // Columna deleted_at no existe: crearla y volver a intentar
          await db.query("ALTER TABLE productos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP");
          await db.query("UPDATE productos SET deleted_at = NOW() WHERE id = $1", [idNum]);
        } else {
          throw softErr;
        }
      }
      await registrarAuditoria("producto_eliminado", session.username, session.role, "productos", idNum, { nombre: delRow?.nombre });
      return res.status(200).json({ success: true, message: "Producto quitado del almacén. Sigue apareciendo en reportes y ventas." });
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

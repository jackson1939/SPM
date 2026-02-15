// apps/backend/src/routes/ventas.ts
import { Router } from "express";
import { query } from "../db";

const router = Router();

router.post("/", async (req, res) => {
  const { producto_id, cantidad } = req.body;
  try {
    // Obtener precio del producto
    const producto = await query("SELECT precio FROM productos WHERE id = $1", [producto_id]);
    if (producto.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const precio = producto.rows[0].precio;
    const total = precio * cantidad;

    // Insertar venta
    const result = await query(
      "INSERT INTO ventas (producto_id, cantidad, total) VALUES ($1, $2, $3) RETURNING *",
      [producto_id, cantidad, total]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar venta" });
  }
});

export default router;
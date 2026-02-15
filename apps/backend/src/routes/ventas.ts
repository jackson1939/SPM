// apps/backend/src/routes/ventas.ts
import { Router } from "express";
import { db } from "@spm/db";

const router = Router();

router.post("/", async (req, res) => {
  const { producto_id, cantidad } = req.body;
  try {
    // Obtener precio del producto
    const producto = await db.producto.findUnique({
      where: { id: producto_id },
      select: { id: true, precio: true, stock: true }
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const precio = producto.precio;
    const total = precio * cantidad;

    // Insertar venta
    const venta = await db.venta.create({
      data: {
        producto_id: producto_id,
        cantidad: cantidad,
        precio_unitario: precio,
        total: total
      }
    });

    res.json(venta);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar venta" });
  }
});

export default router;
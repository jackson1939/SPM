// apps/backend/src/routes/productos.ts
import { Router } from "express";
import { db } from "@spm/db"; // conexión Prisma

const router = Router();

// Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const productos = await db.producto.findMany();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// Crear producto
router.post("/", async (req, res) => {
  const { codigo_barras, nombre, precio, stock } = req.body;
  try {
    const nuevo = await db.producto.create({
      data: { codigo_barras, nombre, precio, stock },
    });
    res.json(nuevo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear producto" });
  }
});

// Editar producto
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock } = req.body;
  try {
    const actualizado = await db.producto.update({
      where: { id: Number(id) },
      data: { nombre, precio, stock },
    });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// Eliminar producto
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.producto.delete({ where: { id: Number(id) } });
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

export default router;

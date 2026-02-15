// apps/backend/src/routes/productos.ts
import { Router, Request, Response } from "express";
import { db } from "@spm/db"; // conexión Prisma

const router = Router();

// Obtener todos los productos
router.get("/", async (req: Request, res: Response) => {
  try {
    const productos = await db.producto.findMany({
      orderBy: { id: "asc" },
    });
    res.status(200).json(productos);
  } catch (error: any) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ 
      error: "Error al obtener productos",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Obtener un producto por ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const producto = await db.producto.findUnique({
      where: { id: Number(id) },
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json(producto);
  } catch (error: any) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ 
      error: "Error al obtener producto",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Crear producto
router.post("/", async (req: Request, res: Response) => {
  try {
    const { codigo_barras, nombre, precio, stock } = req.body;

    // Validación de datos requeridos
    if (!codigo_barras || !nombre || precio === undefined || precio === null) {
      return res.status(400).json({ 
        error: "Datos incompletos. Se requieren: codigo_barras, nombre y precio" 
      });
    }

    // Validar tipos
    if (typeof nombre !== "string" || nombre.trim().length === 0) {
      return res.status(400).json({ error: "El nombre debe ser un texto válido" });
    }

    if (typeof precio !== "number" || precio < 0) {
      return res.status(400).json({ error: "El precio debe ser un número positivo" });
    }

    // Verificar si el código de barras ya existe
    const existingProduct = await db.producto.findUnique({
      where: { codigo_barras },
    });

    if (existingProduct) {
      return res.status(409).json({ error: "El código de barras ya existe" });
    }

    // Crear producto
    const nuevo = await db.producto.create({
      data: { 
        codigo_barras: codigo_barras.trim(),
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        stock: stock ? parseInt(stock) : 0,
      },
    });

    res.status(201).json(nuevo);
  } catch (error: any) {
    console.error("Error al crear producto:", error);
    
    // Manejo de errores específicos de Prisma
    if (error.code === "P2002") {
      return res.status(409).json({ error: "El código de barras ya existe" });
    }

    res.status(500).json({ 
      error: "Error al crear producto",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Editar producto
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, precio, stock, codigo_barras } = req.body;

    // Verificar que el producto existe
    const productoExistente = await db.producto.findUnique({
      where: { id: Number(id) },
    });

    if (!productoExistente) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Validaciones
    const updateData: any = {};
    
    if (nombre !== undefined) {
      if (typeof nombre !== "string" || nombre.trim().length === 0) {
        return res.status(400).json({ error: "El nombre debe ser un texto válido" });
      }
      updateData.nombre = nombre.trim();
    }

    if (precio !== undefined) {
      if (typeof precio !== "number" || precio < 0) {
        return res.status(400).json({ error: "El precio debe ser un número positivo" });
      }
      updateData.precio = parseFloat(precio);
    }

    if (stock !== undefined) {
      if (typeof stock !== "number" || stock < 0) {
        return res.status(400).json({ error: "El stock debe ser un número positivo" });
      }
      updateData.stock = parseInt(stock);
    }

    if (codigo_barras !== undefined && codigo_barras !== productoExistente.codigo_barras) {
      // Verificar si el nuevo código de barras ya existe
      const existingProduct = await db.producto.findUnique({
        where: { codigo_barras },
      });

      if (existingProduct) {
        return res.status(409).json({ error: "El código de barras ya existe" });
      }
      updateData.codigo_barras = codigo_barras.trim();
    }

    const actualizado = await db.producto.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.status(200).json(actualizado);
  } catch (error: any) {
    console.error("Error al actualizar producto:", error);
    
    if (error.code === "P2002") {
      return res.status(409).json({ error: "El código de barras ya existe" });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(500).json({ 
      error: "Error al actualizar producto",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Eliminar producto
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el producto existe
    const producto = await db.producto.findUnique({
      where: { id: Number(id) },
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await db.producto.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "Producto eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar producto:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(500).json({ 
      error: "Error al eliminar producto",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

export default router;

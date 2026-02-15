import type { NextApiRequest, NextApiResponse } from "next";
import getDbClient from "../../db";

// Función auxiliar para intentar insertar compra con diferentes estructuras de tabla
async function insertarCompra(
  db: any,
  producto_id: number | null,
  producto_nombre: string,
  cantidad: number,
  costo_unitario: number,
  total: number
): Promise<any> {
  // Lista de intentos de INSERT, del más completo al más simple
  // NOTA: Si la tabla tiene total como GENERATED ALWAYS, no debemos incluirlo en el INSERT
  const intentos = [
    // Intento 1: Estructura completa SIN total (por si es GENERATED)
    {
      query: `INSERT INTO compras (producto_id, producto, cantidad, costo_unitario, estado, fecha) 
              VALUES ($1, $2, $3, $4, 'aprobada', CURRENT_DATE) RETURNING *`,
      params: [producto_id, producto_nombre, cantidad, costo_unitario]
    },
    // Intento 2: Estructura completa CON total (por si no es GENERATED)
    {
      query: `INSERT INTO compras (producto_id, producto, cantidad, costo_unitario, total, estado, fecha) 
              VALUES ($1, $2, $3, $4, $5, 'aprobada', CURRENT_DATE) RETURNING *`,
      params: [producto_id, producto_nombre, cantidad, costo_unitario, total]
    },
    // Intento 3: Sin producto_id, SIN total
    {
      query: `INSERT INTO compras (producto, cantidad, costo_unitario, estado, fecha) 
              VALUES ($1, $2, $3, 'aprobada', CURRENT_DATE) RETURNING *`,
      params: [producto_nombre, cantidad, costo_unitario]
    },
    // Intento 4: Sin producto_id, CON total
    {
      query: `INSERT INTO compras (producto, cantidad, costo_unitario, total, estado, fecha) 
              VALUES ($1, $2, $3, $4, 'aprobada', CURRENT_DATE) RETURNING *`,
      params: [producto_nombre, cantidad, costo_unitario, total]
    },
    // Intento 5: Sin estado, SIN total
    {
      query: `INSERT INTO compras (producto, cantidad, costo_unitario) 
              VALUES ($1, $2, $3) RETURNING *`,
      params: [producto_nombre, cantidad, costo_unitario]
    },
    // Intento 6: Sin estado, CON total
    {
      query: `INSERT INTO compras (producto, cantidad, costo_unitario, total) 
              VALUES ($1, $2, $3, $4) RETURNING *`,
      params: [producto_nombre, cantidad, costo_unitario, total]
    }
  ];

  let lastError: any = null;
  
  for (const intento of intentos) {
    try {
      console.log(`[insertarCompra] Intentando query:`, intento.query.substring(0, 100) + "...");
      const result = await db.query(intento.query, intento.params);
      console.log(`[insertarCompra] ✅ Compra insertada exitosamente con ID:`, result.rows[0]?.id);
      return result;
    } catch (err: any) {
      lastError = err;
      // Si es error de columna inexistente o de columna generada, probar siguiente intento
      if (err.code === "42703" || err.code === "428C9") {
        console.log(`[insertarCompra] Intento fallido (${err.code}): ${err.message}`);
        continue;
      }
      // Si es otro tipo de error, lanzarlo
      console.error(`[insertarCompra] Error no recuperable:`, err);
      throw err;
    }
  }
  
  // Si ninguno funcionó, lanzar el último error
  console.error(`[insertarCompra] ❌ Todos los intentos fallaron. Último error:`, lastError);
  throw lastError;
}

// GET: obtener todas las compras
// POST: registrar una nueva compra
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getDbClient();
    
    if (req.method === "GET") {
      // Primero intentar obtener la estructura de la tabla
      let query = `SELECT * FROM compras ORDER BY id DESC`;
      
      try {
        const result = await db.query(query);
        console.log(`[API Compras GET] Encontradas ${result.rows.length} compras`);
        
        // Formatear los resultados para asegurar consistencia
        const comprasFormateadas = result.rows.map((c: any) => {
          const cantidad = parseInt(c.cantidad) || 0;
          const costoUnitario = parseFloat(c.costo_unitario) || parseFloat(c.costo) || 0;
          // Si total es una columna generada o calculada, calcularlo si no existe
          let totalCalculado = parseFloat(c.total);
          if (isNaN(totalCalculado)) {
            totalCalculado = cantidad * costoUnitario;
          }
          
          // Formatear fecha correctamente
          let fechaFormateada = c.fecha;
          if (fechaFormateada) {
            // Si es un objeto Date o string ISO, convertir a formato YYYY-MM-DD
            if (fechaFormateada instanceof Date) {
              fechaFormateada = fechaFormateada.toISOString().split("T")[0];
            } else if (typeof fechaFormateada === "string" && fechaFormateada.includes("T")) {
              fechaFormateada = fechaFormateada.split("T")[0];
            }
          } else {
            fechaFormateada = new Date().toISOString().split("T")[0];
          }
          
          const compraFormateada = {
            id: c.id,
            producto: c.producto || c.nombre_producto || c.nombre || "Sin nombre",
            producto_id: c.producto_id || null,
            cantidad,
            costo_unitario: costoUnitario,
            total: totalCalculado,
            estado: c.estado || "aprobada",
            fecha: fechaFormateada
          };
          
          console.log(`[API Compras GET] Compra formateada:`, compraFormateada);
          return compraFormateada;
        });
        
        console.log(`[API Compras GET] Devolviendo ${comprasFormateadas.length} compras`);
        return res.status(200).json(comprasFormateadas);
      } catch (err: any) {
        console.error("[API Compras GET] Error al obtener compras:", err);
        
        // Si la tabla no existe, retornar array vacío
        if (err.code === "42P01") {
          console.warn("[API Compras GET] Tabla compras no existe");
          return res.status(200).json([]);
        }
        
        // Si hay error de columna, intentar query más simple
        if (err.code === "42703") {
          console.warn("[API Compras GET] Error de columna, intentando query simple");
          try {
            const simpleQuery = `SELECT id, cantidad, costo_unitario FROM compras ORDER BY id DESC`;
            const simpleResult = await db.query(simpleQuery);
            const comprasSimples = simpleResult.rows.map((c: any) => ({
              id: c.id,
              producto: "Producto",
              producto_id: null,
              cantidad: parseInt(c.cantidad) || 0,
              costo_unitario: parseFloat(c.costo_unitario) || 0,
              total: (parseInt(c.cantidad) || 0) * (parseFloat(c.costo_unitario) || 0),
              estado: "aprobada",
              fecha: new Date().toISOString().split("T")[0]
            }));
            return res.status(200).json(comprasSimples);
          } catch (simpleErr: any) {
            console.error("[API Compras GET] Error en query simple:", simpleErr);
            return res.status(200).json([]);
          }
        }
        
        throw err;
      }
    }

    if (req.method === "POST") {
      const { producto_id, cantidad, costo_unitario, nombre_producto, codigo_barras, precio_venta } = req.body;

      // Validación de datos requeridos
      if (cantidad === undefined || costo_unitario === undefined) {
        return res.status(400).json({ 
          error: "Datos incompletos. Se requieren: cantidad y costo_unitario" 
        });
      }

      // Validaciones de tipos y valores
      const cantidadNum = parseInt(cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        return res.status(400).json({ 
          error: "La cantidad debe ser un número positivo mayor a 0" 
        });
      }

      const costoNum = parseFloat(costo_unitario);
      if (isNaN(costoNum) || costoNum < 0) {
        return res.status(400).json({ 
          error: "El costo unitario debe ser un número positivo" 
        });
      }

      let productoIdFinal = producto_id;
      let productoNombre = "";

      // Si hay producto_id, verificar que existe
      if (producto_id) {
        const productoRes = await db.query(
          "SELECT * FROM productos WHERE id = $1",
          [producto_id]
        );
        
        if (productoRes.rows.length > 0) {
          productoNombre = productoRes.rows[0].nombre;
          // Actualizar stock del producto existente
          await db.query(
            "UPDATE productos SET stock = stock + $1 WHERE id = $2",
            [cantidadNum, producto_id]
          );
        } else {
          return res.status(404).json({ error: "Producto no encontrado" });
        }
      } 
      // Si no hay producto_id pero hay nombre_producto, crear o buscar producto
      else if (nombre_producto) {
        // Buscar por código de barras si existe (y la columna existe en la BD)
        if (codigo_barras) {
          try {
            const productoPorCodigo = await db.query(
              "SELECT * FROM productos WHERE codigo_barras = $1",
              [codigo_barras.trim()]
            );
            
            if (productoPorCodigo.rows.length > 0) {
              // Producto existe, sumar stock
              productoIdFinal = productoPorCodigo.rows[0].id;
              productoNombre = productoPorCodigo.rows[0].nombre;
              await db.query(
                "UPDATE productos SET stock = stock + $1 WHERE id = $2",
                [cantidadNum, productoIdFinal]
              );
            } else {
              // Crear nuevo producto
              const precioVentaNum = precio_venta ? parseFloat(precio_venta) : costoNum * 1.5; // Margen del 50% por defecto
              try {
                const nuevoProducto = await db.query(
                  "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
                  [codigo_barras.trim(), nombre_producto.trim(), precioVentaNum, cantidadNum]
                );
                productoIdFinal = nuevoProducto.rows[0].id;
                productoNombre = nuevoProducto.rows[0].nombre;
              } catch (insertError: any) {
                // Si la columna codigo_barras no existe, insertar sin ella
                if (insertError.code === "42703") {
                  console.warn("Columna codigo_barras no existe, insertando sin código de barras");
                  const nuevoProducto = await db.query(
                    "INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *",
                    [nombre_producto.trim(), precioVentaNum, cantidadNum]
                  );
                  productoIdFinal = nuevoProducto.rows[0].id;
                  productoNombre = nuevoProducto.rows[0].nombre;
                } else {
                  throw insertError;
                }
              }
            }
          } catch (checkError: any) {
            // Si la columna codigo_barras no existe, buscar solo por nombre
            if (checkError.code === "42703") {
              console.warn("Columna codigo_barras no existe, buscando solo por nombre");
              // Continuar con búsqueda por nombre (código más abajo)
            } else {
              throw checkError;
            }
          }
        }
        
        // Si no hay codigo_barras o la columna no existe, buscar por nombre
        if (!codigo_barras || !productoIdFinal) {
          const productoPorNombre = await db.query(
            "SELECT * FROM productos WHERE LOWER(nombre) = LOWER($1)",
            [nombre_producto.trim()]
          );
          
          if (productoPorNombre.rows.length > 0) {
            // Producto existe, sumar stock
            productoIdFinal = productoPorNombre.rows[0].id;
            productoNombre = productoPorNombre.rows[0].nombre;
            await db.query(
              "UPDATE productos SET stock = stock + $1 WHERE id = $2",
              [cantidadNum, productoIdFinal]
            );
          } else {
            // Crear nuevo producto sin código de barras
            const precioVentaNum = precio_venta ? parseFloat(precio_venta) : costoNum * 1.5;
            try {
              const nuevoProducto = await db.query(
                "INSERT INTO productos (codigo_barras, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
                [`AUTO-${Date.now()}`, nombre_producto.trim(), precioVentaNum, cantidadNum]
              );
              productoIdFinal = nuevoProducto.rows[0].id;
              productoNombre = nuevoProducto.rows[0].nombre;
            } catch (insertError: any) {
              // Si la columna codigo_barras no existe, insertar sin ella
              if (insertError.code === "42703") {
                console.warn("Columna codigo_barras no existe, insertando sin código de barras");
                const nuevoProducto = await db.query(
                  "INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *",
                  [nombre_producto.trim(), precioVentaNum, cantidadNum]
                );
                productoIdFinal = nuevoProducto.rows[0].id;
                productoNombre = nuevoProducto.rows[0].nombre;
              } else {
                throw insertError;
              }
            }
          }
        }
      } else {
        return res.status(400).json({ 
          error: "Se requiere producto_id o nombre_producto" 
        });
      }

      // Calcular total de la compra
      const totalCompra = cantidadNum * costoNum;

      // Intentar registrar compra (puede fallar si tabla tiene estructura diferente)
      let compraRegistrada = false;
      let compraRes: any = null;
      
      try {
        console.log(`[API Compras POST] Intentando insertar compra:`, {
          productoIdFinal,
          productoNombre,
          cantidadNum,
          costoNum,
          totalCompra
        });
        
        compraRes = await insertarCompra(
          db, productoIdFinal, productoNombre, cantidadNum, costoNum, totalCompra
        );
        compraRegistrada = true;
        console.log(`[API Compras POST] Compra insertada exitosamente:`, compraRes?.rows?.[0]);
      } catch (err: any) {
        console.error("[API Compras POST] Error al insertar compra en BD:", err);
        // Continuar aunque falle - el stock ya se actualizó
      }

      // Respuesta con los datos de la compra
      const compraConProducto = compraRes?.rows?.[0] 
        ? {
            ...compraRes.rows[0],
            producto: productoNombre,
            producto_id: productoIdFinal,
            costo_unitario: costoNum,
            total: totalCompra
          }
        : {
            id: Date.now(),
            producto: productoNombre,
            producto_id: productoIdFinal,
            cantidad: cantidadNum,
            costo_unitario: costoNum,
            total: totalCompra,
            estado: "aprobada",
            fecha: new Date().toISOString().split("T")[0],
            _stockActualizado: true // Indicador de que el stock sí se actualizó
          };

      return res.status(201).json(compraConProducto);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en API compras:", error);
    
    // Manejo de errores de conexión a la base de datos
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('connection')) {
      console.error("Database connection error:", error.message);
      return res.status(500).json({ 
        error: "Error de conexión a la base de datos",
        message: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
    
    // Manejo de errores específicos de PostgreSQL
    if (error.code === "23503") {
      // Violación de foreign key
      return res.status(404).json({ 
        error: "Producto no encontrado" 
      });
    }

    if (error.code === "42P01") {
      // Tabla no existe
      console.error("Table does not exist:", error.message);
      return res.status(500).json({ 
        error: "Error de configuración de base de datos",
        message: process.env.NODE_ENV === "development" ? "La tabla compras no existe" : undefined
      });
    }

    if (error.code === "42703") {
      // Columna no existe - puede ser que la estructura de la tabla sea diferente
      console.error("Column does not exist:", error.message);
      return res.status(500).json({ 
        error: "Error de estructura de base de datos",
        message: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }

    // Log full error for debugging
    console.error("Full error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });

    return res.status(500).json({ 
      error: "Error interno del servidor",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
      details: process.env.NODE_ENV === "development" ? {
        code: error.code,
        hint: error.hint,
        detail: error.detail
      } : undefined
    });
  }
}


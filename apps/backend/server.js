// apps/backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { query, getClient } = require('./db/config');

const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// MIDDLEWARES
// ========================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, req.body);
  next();
});

// ========================================
// ENDPOINTS - PRODUCTOS
// ========================================

// GET /productos - Obtener todos los productos
app.get('/productos', async (req, res) => {
  try {
    const { activo, categoria, search } = req.query;
    
    let queryText = 'SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (activo !== undefined) {
      queryText += ` AND p.activo = $${paramCount}`;
      params.push(activo === 'true');
      paramCount++;
    }
    
    if (categoria) {
      queryText += ` AND p.categoria_id = $${paramCount}`;
      params.push(categoria);
      paramCount++;
    }
    
    if (search) {
      queryText += ` AND (p.nombre ILIKE $${paramCount} OR p.codigo_barras ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    queryText += ' ORDER BY p.nombre ASC';
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos', details: error.message });
  }
});

// GET /productos/:id - Obtener un producto por ID
app.get('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto', details: error.message });
  }
});

// POST /productos - Crear un nuevo producto
app.post('/productos', async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      costo,
      stock,
      stock_minimo,
      categoria_id,
      codigo_barras,
      imagen_url
    } = req.body;
    
    // Validaciones
    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
    
    if (precio < 0) {
      return res.status(400).json({ error: 'El precio no puede ser negativo' });
    }
    
    const result = await query(
      `INSERT INTO productos (nombre, descripcion, precio, costo, stock, stock_minimo, categoria_id, codigo_barras, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nombre, descripcion || null, precio, costo || 0, stock || 0, stock_minimo || 5, categoria_id || null, codigo_barras || null, imagen_url || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al crear producto:', error);
    if (error.code === '23505') { // Violación de unique constraint
      return res.status(400).json({ error: 'El código de barras ya existe' });
    }
    res.status(500).json({ error: 'Error al crear producto', details: error.message });
  }
});

// PUT /productos/:id - Actualizar un producto
app.put('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio,
      costo,
      stock,
      stock_minimo,
      categoria_id,
      codigo_barras,
      imagen_url,
      activo
    } = req.body;
    
    const result = await query(
      `UPDATE productos 
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           precio = COALESCE($3, precio),
           costo = COALESCE($4, costo),
           stock = COALESCE($5, stock),
           stock_minimo = COALESCE($6, stock_minimo),
           categoria_id = COALESCE($7, categoria_id),
           codigo_barras = COALESCE($8, codigo_barras),
           imagen_url = COALESCE($9, imagen_url),
           activo = COALESCE($10, activo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [nombre, descripcion, precio, costo, stock, stock_minimo, categoria_id, codigo_barras, imagen_url, activo, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto', details: error.message });
  }
});

// DELETE /productos/:id - Eliminar (desactivar) un producto
app.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - solo marcar como inactivo
    const result = await query(
      'UPDATE productos SET activo = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json({ message: 'Producto desactivado exitosamente', producto: result.rows[0] });
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto', details: error.message });
  }
});

// GET /productos/bajo-stock - Productos con stock bajo
app.get('/productos-bajo-stock', async (req, res) => {
  try {
    const result = await query('SELECT * FROM productos_bajo_stock');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener productos con bajo stock:', error);
    res.status(500).json({ error: 'Error al obtener productos', details: error.message });
  }
});

// ========================================
// ENDPOINTS - VENTAS
// ========================================

// GET /ventas - Obtener todas las ventas
app.get('/ventas', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, producto_id } = req.query;
    
    let queryText = `
      SELECT v.*, p.nombre as producto_nombre, p.codigo_barras
      FROM ventas v
      INNER JOIN productos p ON v.producto_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (fecha_inicio) {
      queryText += ` AND v.fecha >= $${paramCount}`;
      params.push(fecha_inicio);
      paramCount++;
    }
    
    if (fecha_fin) {
      queryText += ` AND v.fecha <= $${paramCount}`;
      params.push(fecha_fin);
      paramCount++;
    }
    
    if (producto_id) {
      queryText += ` AND v.producto_id = $${paramCount}`;
      params.push(producto_id);
      paramCount++;
    }
    
    queryText += ' ORDER BY v.fecha DESC';
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas', details: error.message });
  }
});

// POST /ventas - Registrar una nueva venta
app.post('/ventas', async (req, res) => {
  const client = await getClient();
  
  try {
    const { producto_id, cantidad, metodo_pago, notas } = req.body;
    
    // Validaciones
    if (!producto_id || !cantidad) {
      return res.status(400).json({ error: 'producto_id y cantidad son requeridos' });
    }
    
    if (cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }
    
    await client.query('BEGIN');
    
    // Obtener información del producto
    const productoResult = await client.query(
      'SELECT * FROM productos WHERE id = $1 AND activo = TRUE',
      [producto_id]
    );
    
    if (productoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado o inactivo' });
    }
    
    const producto = productoResult.rows[0];
    
    // Verificar stock
    if (producto.stock < cantidad) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Stock insuficiente',
        stock_disponible: producto.stock,
        cantidad_solicitada: cantidad
      });
    }
    
    // Calcular total
    const total = producto.precio * cantidad;
    
    // Insertar venta
    const ventaResult = await client.query(
      `INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago, notas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [producto_id, cantidad, producto.precio, total, metodo_pago || 'efectivo', notas || null]
    );
    
    // Actualizar stock
    await client.query(
      'UPDATE productos SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [cantidad, producto_id]
    );
    
    await client.query('COMMIT');
    
    const venta = ventaResult.rows[0];
    
    res.status(201).json({
      ...venta,
      producto_nombre: producto.nombre,
      nuevo_stock: producto.stock - cantidad
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al registrar venta:', error);
    res.status(500).json({ error: 'Error al registrar venta', details: error.message });
  } finally {
    client.release();
  }
});

// GET /ventas/resumen - Resumen de ventas
app.get('/ventas/resumen', async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaFiltro = fecha || new Date().toISOString().split('T')[0];
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_ventas,
        COALESCE(SUM(total), 0) as monto_total,
        COALESCE(AVG(total), 0) as ticket_promedio,
        COALESCE(SUM(cantidad), 0) as unidades_vendidas
      FROM ventas
      WHERE DATE(fecha) = $1
    `, [fechaFiltro]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al obtener resumen de ventas:', error);
    res.status(500).json({ error: 'Error al obtener resumen', details: error.message });
  }
});

// ========================================
// ENDPOINTS - COMPRAS
// ========================================

// GET /compras - Obtener todas las compras
app.get('/compras', async (req, res) => {
  try {
    const { estado, fecha_inicio, fecha_fin } = req.query;
    
    let queryText = 'SELECT * FROM compras WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (estado) {
      queryText += ` AND estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }
    
    if (fecha_inicio) {
      queryText += ` AND fecha >= $${paramCount}`;
      params.push(fecha_inicio);
      paramCount++;
    }
    
    if (fecha_fin) {
      queryText += ` AND fecha <= $${paramCount}`;
      params.push(fecha_fin);
      paramCount++;
    }
    
    queryText += ' ORDER BY fecha DESC, created_at DESC';
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener compras:', error);
    res.status(500).json({ error: 'Error al obtener compras', details: error.message });
  }
});

// POST /compras - Registrar una nueva compra
app.post('/compras', async (req, res) => {
  try {
    const {
      producto,
      cantidad,
      costo_unitario,
      estado,
      proveedor,
      notas
    } = req.body;
    
    // Validaciones
    if (!producto || !cantidad || !costo_unitario) {
      return res.status(400).json({ 
        error: 'producto, cantidad y costo_unitario son requeridos' 
      });
    }
    
    if (cantidad <= 0 || costo_unitario < 0) {
      return res.status(400).json({ 
        error: 'Cantidad debe ser mayor a 0 y costo no puede ser negativo' 
      });
    }
    
    const total = cantidad * costo_unitario;
    
    const result = await query(
      `INSERT INTO compras (producto, cantidad, costo_unitario, total, estado, proveedor, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [producto, cantidad, costo_unitario, total, estado || 'aprobada', proveedor || null, notas || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al registrar compra:', error);
    res.status(500).json({ error: 'Error al registrar compra', details: error.message });
  }
});

// PUT /compras/:id - Actualizar estado de compra
app.put('/compras/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;
    
    if (!['aprobada', 'pendiente', 'rechazada'].includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado debe ser: aprobada, pendiente o rechazada' 
      });
    }
    
    const result = await query(
      `UPDATE compras 
       SET estado = $1, 
           notas = COALESCE($2, notas),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [estado, notas, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al actualizar compra:', error);
    res.status(500).json({ error: 'Error al actualizar compra', details: error.message });
  }
});

// ========================================
// ENDPOINTS - CATEGORÍAS
// ========================================

// GET /categorias - Obtener todas las categorías
app.get('/categorias', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías', details: error.message });
  }
});

// POST /categorias - Crear una nueva categoría
app.post('/categorias', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    const result = await query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al crear categoría:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear categoría', details: error.message });
  }
});

// ========================================
// ENDPOINT DE SALUD
// ========================================
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// ========================================
// MANEJO DE ERRORES
// ========================================
app.use((err, req, res, next) => {
  console.error('💥 Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// ========================================
// INICIAR SERVIDOR
// ========================================
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🚀 VEROKAI POS - Backend Server     ║
  ╠════════════════════════════════════════╣
  ║   Puerto: ${PORT}                        ║
  ║   Entorno: ${process.env.NODE_ENV || 'development'}          ║
  ║   Base de datos: Neon PostgreSQL      ║
  ╚════════════════════════════════════════╝
  `);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

module.exports = app;
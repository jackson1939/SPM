-- apps/backend/db/schema.sql
-- Script de inicialización de la base de datos para VEROKAI POS

-- Eliminar tablas si existen (usar con precaución)
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

-- ========================================
-- TABLA: categorias
-- ========================================
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: productos
-- ========================================
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
  costo DECIMAL(10, 2) DEFAULT 0 CHECK (costo >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INTEGER DEFAULT 5,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  codigo_barras VARCHAR(100) UNIQUE,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: ventas
-- ========================================
CREATE TABLE ventas (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  metodo_pago VARCHAR(50) DEFAULT 'efectivo',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: compras
-- ========================================
CREATE TABLE compras (
  id SERIAL PRIMARY KEY,
  producto VARCHAR(255) NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(10, 2) NOT NULL CHECK (costo_unitario >= 0),
  total DECIMAL(10, 2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'aprobada' CHECK (estado IN ('aprobada', 'pendiente', 'rechazada')),
  fecha DATE DEFAULT CURRENT_DATE,
  proveedor VARCHAR(255),
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ÍNDICES para mejor rendimiento
-- ========================================
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_producto ON ventas(producto_id);
CREATE INDEX idx_compras_fecha ON compras(fecha);
CREATE INDEX idx_compras_estado ON compras(estado);

-- ========================================
-- TRIGGERS para actualizar updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON categorias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compras_updated_at
  BEFORE UPDATE ON compras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DATOS DE PRUEBA (Opcional)
-- ========================================

-- Categorías de ejemplo
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Bebidas', 'Bebidas alcohólicas y no alcohólicas'),
  ('Snacks', 'Bocadillos y aperitivos'),
  ('Limpieza', 'Productos de limpieza del hogar'),
  ('Lácteos', 'Productos lácteos y derivados'),
  ('Panadería', 'Pan y productos de panadería');

-- Productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, costo, stock, stock_minimo, categoria_id, codigo_barras) VALUES
  ('Coca Cola 2L', 'Bebida gaseosa sabor cola', 2.50, 1.50, 50, 10, 1, '7501234567890'),
  ('Papas Lays Original', 'Papas fritas sabor original 150g', 1.75, 1.00, 100, 20, 2, '7501234567891'),
  ('Detergente Ace', 'Detergente en polvo 1kg', 4.50, 2.80, 30, 5, 3, '7501234567892'),
  ('Leche Lala Entera 1L', 'Leche entera pasteurizada', 1.50, 0.90, 60, 15, 4, '7501234567893'),
  ('Pan Blanco', 'Pan de caja blanco', 1.20, 0.70, 80, 20, 5, '7501234567894'),
  ('Agua Bonafont 1.5L', 'Agua purificada embotellada', 1.00, 0.60, 120, 25, 1, '7501234567895'),
  ('Galletas Oreo', 'Galletas de chocolate con crema', 2.00, 1.20, 70, 15, 2, '7501234567896'),
  ('Suavitel 1L', 'Suavizante de telas aroma floral', 3.50, 2.00, 40, 10, 3, '7501234567897'),
  ('Yogurt Danone', 'Yogurt natural 1kg', 2.50, 1.50, 50, 10, 4, '7501234567898'),
  ('Bolillo', 'Pan bolillo tradicional', 0.50, 0.25, 200, 50, 5, '7501234567899');

-- Ventas de ejemplo
INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago) VALUES
  (1, 2, 2.50, 5.00, 'efectivo'),
  (2, 3, 1.75, 5.25, 'tarjeta'),
  (6, 5, 1.00, 5.00, 'efectivo'),
  (10, 10, 0.50, 5.00, 'efectivo');

-- Compras de ejemplo
INSERT INTO compras (producto, cantidad, costo_unitario, total, estado, proveedor) VALUES
  ('Coca Cola 2L', 50, 1.50, 75.00, 'aprobada', 'Distribuidora FEMSA'),
  ('Papas Lays Original', 100, 1.00, 100.00, 'aprobada', 'Sabritas SA'),
  ('Detergente Ace', 30, 2.80, 84.00, 'aprobada', 'Procter & Gamble');

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista de productos con bajo stock
CREATE OR REPLACE VIEW productos_bajo_stock AS
SELECT 
  p.id,
  p.nombre,
  p.stock,
  p.stock_minimo,
  c.nombre as categoria,
  (p.stock_minimo - p.stock) as unidades_faltantes
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.stock <= p.stock_minimo AND p.activo = TRUE
ORDER BY (p.stock_minimo - p.stock) DESC;

-- Vista de resumen de ventas diarias
CREATE OR REPLACE VIEW ventas_diarias AS
SELECT 
  DATE(fecha) as fecha,
  COUNT(*) as total_ventas,
  SUM(total) as monto_total,
  AVG(total) as ticket_promedio,
  SUM(cantidad) as unidades_vendidas
FROM ventas
GROUP BY DATE(fecha)
ORDER BY fecha DESC;

-- Vista de productos más vendidos
CREATE OR REPLACE VIEW productos_mas_vendidos AS
SELECT 
  p.id,
  p.nombre,
  p.precio,
  SUM(v.cantidad) as unidades_vendidas,
  SUM(v.total) as ingresos_totales,
  COUNT(v.id) as veces_vendido
FROM productos p
INNER JOIN ventas v ON p.id = v.producto_id
GROUP BY p.id, p.nombre, p.precio
ORDER BY unidades_vendidas DESC
LIMIT 10;

-- ========================================
-- FUNCIONES ÚTILES
-- ========================================

-- Función para registrar una venta y actualizar stock
CREATE OR REPLACE FUNCTION registrar_venta(
  p_producto_id INTEGER,
  p_cantidad INTEGER,
  p_metodo_pago VARCHAR DEFAULT 'efectivo'
) RETURNS TABLE (
  venta_id INTEGER,
  producto_nombre VARCHAR,
  total_venta DECIMAL
) AS $$
DECLARE
  v_precio DECIMAL(10,2);
  v_stock_actual INTEGER;
  v_nombre VARCHAR(255);
  v_venta_id INTEGER;
  v_total DECIMAL(10,2);
BEGIN
  -- Obtener información del producto
  SELECT precio, stock, nombre INTO v_precio, v_stock_actual, v_nombre
  FROM productos
  WHERE id = p_producto_id AND activo = TRUE;
  
  -- Verificar que el producto existe
  IF v_precio IS NULL THEN
    RAISE EXCEPTION 'Producto no encontrado o inactivo';
  END IF;
  
  -- Verificar stock suficiente
  IF v_stock_actual < p_cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', v_stock_actual, p_cantidad;
  END IF;
  
  -- Calcular total
  v_total := v_precio * p_cantidad;
  
  -- Insertar venta
  INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago)
  VALUES (p_producto_id, p_cantidad, v_precio, v_total, p_metodo_pago)
  RETURNING id INTO v_venta_id;
  
  -- Actualizar stock
  UPDATE productos
  SET stock = stock - p_cantidad,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_producto_id;
  
  -- Retornar resultado
  RETURN QUERY SELECT v_venta_id, v_nombre, v_total;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar una compra
CREATE OR REPLACE FUNCTION registrar_compra(
  p_producto VARCHAR,
  p_cantidad INTEGER,
  p_costo_unitario DECIMAL,
  p_proveedor VARCHAR DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_compra_id INTEGER;
  v_total DECIMAL(10,2);
BEGIN
  v_total := p_costo_unitario * p_cantidad;
  
  INSERT INTO compras (producto, cantidad, costo_unitario, total, estado, proveedor)
  VALUES (p_producto, p_cantidad, p_costo_unitario, v_total, 'aprobada', p_proveedor)
  RETURNING id INTO v_compra_id;
  
  RETURN v_compra_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERMISOS (Opcional)
-- ========================================
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO tu_usuario;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tu_usuario;

COMMIT;

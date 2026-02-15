-- ============================================
-- Script para arreglar la tabla compras en Neon
-- Ejecutar este script en Neon Console
-- ============================================

-- Primero, verificar qué columnas existen
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'compras'
ORDER BY ordinal_position;

-- ============================================
-- OPCIÓN 1: Si la tabla compras ya existe pero le faltan columnas
-- ============================================

-- Agregar columna producto_id (referencia a productos)
ALTER TABLE compras ADD COLUMN IF NOT EXISTS producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL;

-- Agregar columna producto (nombre del producto como VARCHAR)
ALTER TABLE compras ADD COLUMN IF NOT EXISTS producto VARCHAR(255);

-- Agregar columna costo_unitario
ALTER TABLE compras ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10,2) DEFAULT 0;

-- Agregar columna total
ALTER TABLE compras ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0;

-- Agregar columna estado
ALTER TABLE compras ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'aprobada';

-- Agregar columna fecha si no existe
ALTER TABLE compras ADD COLUMN IF NOT EXISTS fecha DATE DEFAULT CURRENT_DATE;

-- Agregar columna proveedor (opcional)
ALTER TABLE compras ADD COLUMN IF NOT EXISTS proveedor VARCHAR(255);

-- Agregar columna notas (opcional)
ALTER TABLE compras ADD COLUMN IF NOT EXISTS notas TEXT;

-- Agregar timestamps
ALTER TABLE compras ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE compras ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha);
CREATE INDEX IF NOT EXISTS idx_compras_estado ON compras(estado);
CREATE INDEX IF NOT EXISTS idx_compras_producto_id ON compras(producto_id);

-- Actualizar registros existentes para calcular total si es necesario
UPDATE compras 
SET total = cantidad * costo_unitario 
WHERE (total = 0 OR total IS NULL) AND cantidad IS NOT NULL AND costo_unitario IS NOT NULL;

-- ============================================
-- OPCIÓN 2: Si prefieres recrear la tabla (CUIDADO: Borra datos existentes)
-- Descomenta las siguientes líneas si quieres recrear la tabla
-- ============================================
/*
DROP TABLE IF EXISTS compras CASCADE;

CREATE TABLE compras (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  producto VARCHAR(255) NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(10, 2) NOT NULL CHECK (costo_unitario >= 0),
  total DECIMAL(10, 2) DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'aprobada' CHECK (estado IN ('aprobada', 'pendiente', 'rechazada')),
  fecha DATE DEFAULT CURRENT_DATE,
  proveedor VARCHAR(255),
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compras_fecha ON compras(fecha);
CREATE INDEX idx_compras_estado ON compras(estado);
CREATE INDEX idx_compras_producto_id ON compras(producto_id);
*/

-- ============================================
-- Verificar la estructura final
-- ============================================
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'compras'
ORDER BY ordinal_position;

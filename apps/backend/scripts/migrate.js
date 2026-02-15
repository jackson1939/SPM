// apps/backend/scripts/migrate.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  console.log('🔄 Iniciando migración de base de datos...');
  
  try {
    // Leer el archivo SQL
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Ejecutando schema.sql...');
    
    // Ejecutar el schema
    await pool.query(schema);
    
    console.log('✅ Migración completada exitosamente!');
    console.log('');
    console.log('📊 Tablas creadas:');
    console.log('   - categorias');
    console.log('   - productos');
    console.log('   - ventas');
    console.log('   - compras');
    console.log('');
    console.log('🔍 Vistas creadas:');
    console.log('   - productos_bajo_stock');
    console.log('   - ventas_diarias');
    console.log('   - productos_mas_vendidos');
    console.log('');
    console.log('⚙️  Funciones creadas:');
    console.log('   - registrar_venta()');
    console.log('   - registrar_compra()');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = runMigration;
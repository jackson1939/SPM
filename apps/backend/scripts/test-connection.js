// apps/backend/scripts/test-connection.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  console.log('🔍 Probando conexión a PostgreSQL (Neon)...\n');
  
  try {
    // Test básico de conexión
    console.log('1️⃣  Test de conexión básica...');
    const result = await pool.query('SELECT NOW() as current_time, version()');
    console.log('✅ Conectado exitosamente!');
    console.log('   Hora del servidor:', result.rows[0].current_time);
    console.log('   Versión:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);
    console.log('');
    
    // Verificar tablas
    console.log('2️⃣  Verificando tablas...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Tablas encontradas:');
      tables.rows.forEach(t => console.log(`   - ${t.table_name}`));
    } else {
      console.log('⚠️  No se encontraron tablas. Ejecuta: npm run db:migrate');
    }
    console.log('');
    
    // Contar registros
    console.log('3️⃣  Contando registros...');
    
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM categorias) as categorias,
        (SELECT COUNT(*) FROM productos) as productos,
        (SELECT COUNT(*) FROM ventas) as ventas,
        (SELECT COUNT(*) FROM compras) as compras
    `);
    
    if (counts.rows.length > 0) {
      const c = counts.rows[0];
      console.log('✅ Datos en la base:');
      console.log(`   - Categorías: ${c.categorias}`);
      console.log(`   - Productos: ${c.productos}`);
      console.log(`   - Ventas: ${c.ventas}`);
      console.log(`   - Compras: ${c.compras}`);
    }
    console.log('');
    
    // Verificar productos activos
    console.log('4️⃣  Productos activos...');
    const activeProducts = await pool.query(
      'SELECT nombre, precio, stock FROM productos WHERE activo = TRUE LIMIT 5'
    );
    
    if (activeProducts.rows.length > 0) {
      console.log('✅ Primeros productos:');
      activeProducts.rows.forEach(p => {
        console.log(`   - ${p.nombre}: $${p.precio} (Stock: ${p.stock})`);
      });
    } else {
      console.log('⚠️  No hay productos activos');
    }
    console.log('');
    
    console.log('🎉 Todas las pruebas completadas exitosamente!');
    console.log('');
    console.log('📝 Siguiente paso:');
    console.log('   npm run dev    (iniciar servidor en modo desarrollo)');
    console.log('   npm start      (iniciar servidor en modo producción)');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error('');
    console.error('💡 Soluciones posibles:');
    console.error('   1. Verifica que DATABASE_URL esté configurado en .env');
    console.error('   2. Ejecuta: npm run db:migrate');
    console.error('   3. Verifica la conexión a internet');
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar test
if (require.main === module) {
  testConnection()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = testConnection;
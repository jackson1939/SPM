// Database connection pool for Next.js API routes
import { Pool, PoolConfig } from 'pg';

// Create a connection pool
// Using singleton pattern to reuse the same pool across requests
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please create a .env.local file in apps/frontend/ with your database connection string.'
      );
    }

    const poolConfig: PoolConfig = {
      connectionString,
      // Connection pool configuration
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
      ssl: {
        rejectUnauthorized: false, // Required for Neon PostgreSQL
      },
    };

    pool = new Pool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // Don't throw here, just log. The pool will handle reconnection.
    });

    // Test connection on startup (only in development)
    if (process.env.NODE_ENV === 'development') {
      pool.query('SELECT NOW()')
        .then(() => {
          console.log('✅ Database connection pool established successfully');
        })
        .catch((err) => {
          console.error('❌ Database connection failed:', err.message);
        });
    }
  }

  return pool;
}

// Export the pool instance
const poolInstance = getPool();
export default poolInstance;

// Export a function to close the pool (useful for cleanup in tests)
export function closePool(): Promise<void> {
  if (pool) {
    const poolToClose = pool;
    pool = null;
    return poolToClose.end();
  }
  return Promise.resolve();
}


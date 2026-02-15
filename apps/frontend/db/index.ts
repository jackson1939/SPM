// Database connection for Next.js API routes
// Uses Neon serverless driver in Vercel, regular pg Pool in development
import { Pool, PoolConfig } from 'pg';

// For Vercel/serverless: use Neon serverless driver
// For local development: use regular pg Pool
const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV || process.env.NODE_ENV === 'production';

let pool: Pool | null = null;
let neonClient: any = null;

// Interface for database client (pool or neon client)
interface DbClient {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
}

function getNeonClient(): DbClient {
  if (!neonClient) {
    try {
      // Dynamic import for Neon serverless (only in Vercel)
      const { neon } = require('@neondatabase/serverless');
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      // Neon serverless client - it supports PostgreSQL parameterized queries ($1, $2, etc.)
      const neonQuery = neon(connectionString);
      
      // Wrap Neon client to match pg Pool interface
      // Neon returns array directly, pg Pool returns { rows: array }
      neonClient = {
        query: async (text: string, params?: any[]) => {
          try {
            // Neon supports PostgreSQL-style parameterized queries
            // Just pass the query and params directly
            const result = await neonQuery(text, params || []);
            // Neon returns array directly, wrap it to match pg format
            // Handle both array results and single row results
            if (Array.isArray(result)) {
              return { rows: result };
            } else if (result && typeof result === 'object') {
              // Single row result
              return { rows: [result] };
            } else {
              // Empty result or unexpected format
              return { rows: [] };
            }
          } catch (error: any) {
            console.error('Neon query error:', error);
            console.error('Query:', text);
            console.error('Params:', params);
            throw error;
          }
        }
      };
      
      console.log('✅ Using Neon serverless driver');
    } catch (error: any) {
      console.error('Failed to initialize Neon client:', error.message);
      throw error;
    }
  }
  return neonClient;
}

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please configure it in Vercel Environment Variables or create a .env.local file.'
      );
    }

    const poolConfig: PoolConfig = {
      connectionString,
      // Connection pool configuration for local development
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false, // Required for Neon PostgreSQL
      },
    };

    pool = new Pool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      pool = null;
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

// Export a function that returns the appropriate client
// Uses Neon serverless in Vercel, regular pool in development
export default function getDbClient(): DbClient {
  if (isVercel) {
    try {
      return getNeonClient();
    } catch (error) {
      // Fallback to pool if Neon fails
      console.warn('Falling back to pg Pool');
      return getPool();
    }
  }
  return getPool();
}

// Export a function to close the pool (useful for cleanup in tests)
export function closePool(): Promise<void> {
  if (pool) {
    const poolToClose = pool;
    pool = null;
    return poolToClose.end();
  }
  return Promise.resolve();
}


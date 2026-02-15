// Cliente de base de datos
import { PrismaClient } from '@prisma/client';

// Crear instancia del cliente Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Exportar el cliente como 'db' para uso en el backend
export const db = prisma;

// Exportar PrismaClient para uso avanzado si es necesario
export { PrismaClient };

// Re-exportar tipos útiles
export type { Producto } from '@prisma/client';


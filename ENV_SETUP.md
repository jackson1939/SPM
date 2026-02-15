# Configuración de Variables de Entorno

## Archivos .env necesarios

Para que la aplicación funcione correctamente, necesitas crear los siguientes archivos con las variables de entorno:

### 1. `apps/frontend/.env.local`

Crea este archivo en la raíz del proyecto frontend con el siguiente contenido:

```env
# Database URLs for Neon PostgreSQL
# Use pooled connection for general queries (better for serverless)
DATABASE_URL=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# Use unpooled connection for migrations and long-running transactions
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

### 2. `packages/db/.env`

Crea este archivo en la raíz del paquete db con el siguiente contenido:

```env
# Database URLs for Neon PostgreSQL
# Prisma uses DATABASE_URL for migrations and client generation
DATABASE_URL=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# Unpooled connection for migrations
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

### 3. `apps/backend/.env` (opcional, si usas el backend separado)

```env
DATABASE_URL=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

## Notas importantes

- Estos archivos están en `.gitignore` y no se subirán al repositorio
- Asegúrate de que la tabla `productos` exista en la base de datos
- Si necesitas crear la tabla, ejecuta las migraciones de Prisma: `npm run db:migrate`



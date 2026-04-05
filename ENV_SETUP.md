# Configuración de Variables de Entorno

## Archivos .env necesarios

Para que la aplicación funcione correctamente, necesitas crear los siguientes archivos con las variables de entorno:

### 1. `apps/frontend/.env.local`

Crea este archivo en la raíz del proyecto frontend con el siguiente contenido:

```env
# Database URLs for Neon PostgreSQL (valores reales solo en .env local, desde el dashboard de Neon)
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USUARIO:CONTRASEÑA@HOST.region.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=una_cadena_larga_aleatoria
```

### 2. `packages/db/.env`

Crea este archivo en la raíz del paquete db con el siguiente contenido:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USUARIO:CONTRASEÑA@HOST.region.aws.neon.tech/neondb?sslmode=require
```

### 3. `apps/backend/.env` (opcional, si usas el backend separado)

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USUARIO:CONTRASEÑA@HOST.region.aws.neon.tech/neondb?sslmode=require
```

## Notas importantes

- Si alguna URL de base de datos llegó a subirse al repositorio, **rota la contraseña** en Neon y actualiza tus `.env`.
- Estos archivos están en `.gitignore` y no se subirán al repositorio
- Asegúrate de que la tabla `productos` exista en la base de datos
- Si necesitas crear la tabla, ejecuta las migraciones de Prisma: `npm run db:migrate`





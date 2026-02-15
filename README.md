# SPM - Sistema de Punto de Venta

Monorepo para el sistema de gestión de punto de venta con Next.js, Node.js y PostgreSQL (Neon).

## Estructura del Proyecto

```
SPM/
├── apps/
│   ├── frontend/      # Next.js (UI, POS, reportes)
│   └── backend/       # Node.js/Express o Next.js API routes
├── packages/
│   ├── db/            # Configuración de Neon Postgres
│   ├── auth/          # Módulo de autenticación y roles
│   └── utils/         # Funciones compartidas
└── docs/              # Documentación técnica
```

## Requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (Neon)

## Instalación

```bash
npm install
```

## Configuración de Variables de Entorno

**IMPORTANTE**: Antes de ejecutar la aplicación, debes configurar las variables de entorno.

1. Crea el archivo `apps/frontend/.env.local` con:
```env
DATABASE_URL=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

2. Crea el archivo `packages/db/.env` con:
```env
DATABASE_URL=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_2lQvIR8KzXqF@ep-little-hat-ai2d2p93.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

3. Genera el cliente de Prisma y ejecuta las migraciones:
```bash
npm run db:generate
npm run db:migrate
```

Ver `ENV_SETUP.md` para más detalles.

## Scripts Disponibles

- `npm run dev` - Inicia el frontend en modo desarrollo
- `npm run dev:backend` - Inicia el backend en modo desarrollo
- `npm run build` - Construye todos los workspaces
- `npm run db:generate` - Genera el cliente de Prisma
- `npm run db:migrate` - Ejecuta las migraciones
- `npm run db:studio` - Abre Prisma Studio

## Desarrollo

Ver documentación en `/docs` para más detalles sobre arquitectura y desarrollo.


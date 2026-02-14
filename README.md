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

## Scripts Disponibles

- `npm run dev` - Inicia el frontend en modo desarrollo
- `npm run dev:backend` - Inicia el backend en modo desarrollo
- `npm run build` - Construye todos los workspaces
- `npm run db:generate` - Genera el cliente de Prisma
- `npm run db:migrate` - Ejecuta las migraciones
- `npm run db:studio` - Abre Prisma Studio

## Desarrollo

Ver documentación en `/docs` para más detalles sobre arquitectura y desarrollo.


# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SPM (Sistema de Punto de Venta) is a Point of Sale system monorepo with Next.js frontend, Express backend, and PostgreSQL via Neon. The project is written primarily in Spanish.

## Build, Run, and Test Commands

```bash
# Install dependencies
npm install

# Development
npm run dev              # Start frontend (Next.js on port 3000)
npm run dev:backend      # Start backend (Express on port 4000)

# Build
npm run build            # Build all workspaces (packages first, then apps)
npm run build:packages   # Build only packages (db, auth, utils)
npm run build:frontend   # Build only frontend

# Database (Prisma)
npm run db:generate      # Generate Prisma client (required before first run)
npm run db:migrate       # Run migrations in dev mode
npm run db:migrate:deploy # Deploy migrations to production
npm run db:studio        # Open Prisma Studio GUI

# Linting
npm run lint             # Lint all workspaces
```

## Architecture

### Monorepo Structure (npm workspaces)

- `apps/frontend/` - Next.js 14 app with Tailwind CSS, uses **raw SQL via `pg` Pool**
- `apps/backend/` - Express server with TypeScript, uses **Prisma ORM**
- `packages/db/` - Prisma schema and client export (`@spm/db`)
- `packages/auth/` - Auth module with JWT strategy (placeholder)
- `packages/utils/` - Shared utilities (placeholder)

### Dual Database Access Pattern

**Important**: The frontend and backend use different database access methods:

1. **Frontend API Routes** (`apps/frontend/pages/api/`) use raw SQL queries via `pg` Pool:
   ```typescript
   import getDbClient from "../../db";
   const db = getDbClient();
   await db.query("SELECT * FROM productos");
   ```

2. **Backend Express** (`apps/backend/src/routes/`) uses Prisma ORM:
   ```typescript
   import { db } from "@spm/db";
   await db.producto.findMany();
   ```

### Prisma Model Naming Convention

Prisma uses camelCase for model access. The `Producto` model is accessed as `db.producto`:
```typescript
// Correct
await db.producto.findMany();

// Wrong
await db.Producto.findMany();
```

### Database Schema

Located in `packages/db/prisma/schema.prisma`. Models map to lowercase table names:
- `Producto` → `productos` table
- `Compra` → `compras` table

### Environment Variables

Required in multiple locations:
- `apps/frontend/.env.local` - For Next.js API routes
- `packages/db/.env` - For Prisma migrations
- `apps/backend/.env` (optional) - For Express backend

Required variables: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`

### Vercel Deployment

The frontend is deployed to Vercel. In production, it uses `@neondatabase/serverless` driver instead of `pg` Pool. The switching logic is in `apps/frontend/db/index.ts`.

## Error Handling Conventions

### PostgreSQL Error Codes (Frontend)
- `42P01` - Table does not exist
- `42703` - Column does not exist
- `23505` - Unique constraint violation
- `23502` - NOT NULL violation

### Prisma Error Codes (Backend)
- `P2002` - Unique constraint violation
- `P2025` - Record not found

# SPM — Sistema de Punto de Venta

**Monorepo de un POS (Punto de Venta) full-stack para pequeños comercios — Next.js + Express + PostgreSQL (Neon), con roles, auditoría y despliegue en Vercel.**

🌐 **Idioma / Language:** [Español](#español) | [English](#english)

---

<a name="español"></a>

## Español

### 📖 Descripción general

**SPM** (Sistema de Punto de Venta) es una aplicación de gestión comercial para negocios pequeños (tipo kiosco, minimarket o tienda de barrio): control de inventario, ventas en caja (POS), compras a proveedores, historial de precios, reportes y un panel de configuración. El proyecto está escrito casi en su totalidad en español (nombres de tablas, campos, textos de UI) y pensado para ser operado por personal no técnico, con distintos niveles de acceso según el rol de cada empleado.

Dentro del código se encuentran dos nombres comerciales usados como *branding* de la landing/página de bienvenida y de la configuración por defecto de la tienda: **"KIOSKO ROJO"** (página de inicio, atribuida a "ALLDRIX FOUNDRY") y **"VEROKAI POS"** (valor por defecto del nombre de tienda en `configuracion.tsx`). Esto sugiere que la base de código es una plantilla de POS reutilizada/reetiquetada para distintos clientes o marcas — patrón habitual cuando un mismo desarrollador mantiene varios repos de POS similares (por ejemplo, existe también el repositorio [`jackson1939/AXIS-SPM-SS`](https://github.com/jackson1939/AXIS-SPM-SS) del mismo autor, que por nombre y propósito parece emparentado con este proyecto; no se encontró en **este** repo ninguna referencia directa o dependencia cruzada explícita hacia él).

**Nivel de madurez:** proyecto funcional en desarrollo activo / MVP avanzado. Tiene autenticación real, control de acceso por rol, auditoría, exportación a Excel, impresión de tickets y está desplegado en Vercel — pero el historial de git fue reducido a un único commit (`PARCHE DE SEGURIDAD 1`), lo que indica que se aplicó un parche de seguridad reciente (posible exposición previa de credenciales, ver `ENV_SETUP.md`) y que el repositorio no conserva su historial completo. No se encontraron pruebas automatizadas (`npm run test` existe como script pero no hay archivos de test en el repo).

### ✨ Características principales

- **Gestión de inventario (productos):** alta, edición, baja y consulta de productos con código de barras único, nombre, precio, stock, categoría y fecha de ingreso.
- **Punto de venta (POS):** registro de ventas por producto y cantidad, métodos de pago, notas, cálculo de total, e impresión de tickets de venta (`utils/printTicket.ts`) con lógica de vuelto.
- **Compras a proveedores:** registro de compras con costo unitario y actualización de stock (`pages/compras.tsx`, `pages/api/compras.ts`).
- **Historial de precios:** cada cambio de precio de un producto queda registrado (modelo `HistorialPrecio`), permitiendo auditar variaciones de precio en el tiempo.
- **Escaneo/búsqueda por código de barras:** página `scan.tsx` para localizar productos por su código.
- **Reportes:** vistas de reportes de ventas e inventario (`pages/reportes.tsx`, `docs/api-spec.md` define además endpoints de reportes en el backend Express).
- **Dashboard operativo:** ventas de hoy vs. ayer, total de productos, alertas de stock bajo y compras del mes, con exportación de datos a Excel (librería `xlsx`).
- **Autenticación y sesiones propias (sin librerías externas de auth):**
  - Login con usuario/contraseña, contraseñas almacenadas como **hash HMAC-SHA256 + salt** (nunca en texto plano), comparación en tiempo constante (`crypto.timingSafeEqual`) para mitigar *timing attacks*.
  - Sesión firmada con HMAC en una cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción, con expiración de 12 horas.
  - Usuarios adicionales configurables sin tocar código vía la variable de entorno `SPM_APP_USERS_JSON`.
  - Cierre de sesión automático por inactividad (17 minutos) desde el cliente (`useSessionTimeout`), pensado para no agotar el pool de conexiones a Neon.
- **Control de acceso basado en roles (RBAC):** tres roles — `jefe`, `almacen`, `cajero` — verificados tanto en el servidor (`middleware.ts`, `requireAuth`) como en el cliente (`useRoleGuard`, con *fallback* a `localStorage` si la red falla).
- **Auditoría de acciones:** cada acción sensible (login, logout, venta creada, compra creada, producto creado/editado/eliminado, configuración actualizada, migración ejecutada, vaciado de base de datos) queda registrada en una tabla `auditoria`, de forma silenciosa (no interrumpe la operación principal si falla el registro).
- **Panel de configuración:** nombre y datos de la tienda, símbolo de moneda, umbral de stock bajo, credenciales, impresora y pie de ticket configurables (`pages/configuracion.tsx`).
- **Endpoint administrativo de borrado total:** `/api/admin/clear-database`, exclusivo del rol `jefe`, con confirmación explícita en el body (`"BORRAR TODO"`) — acción irreversible y auditada.
- **Doble estrategia de acceso a base de datos según entorno:**
  - En **Vercel/producción**, usa el driver serverless `@neondatabase/serverless` (HTTP, apto para funciones serverless).
  - En **desarrollo local**, usa un `Pool` de `pg` tradicional (TCP), con *fallback* automático a Neon si el pool falla.
- **Tema claro/oscuro** persistido en `localStorage` en la landing page.
- **Backend Express independiente (opcional):** expone parte de la misma API (`productos`, `ventas`, `compras`, `reportes`) usando **Prisma ORM** en lugar de SQL crudo, útil como alternativa desacoplada de Vercel o para integraciones futuras.

### 🛠️ Stack tecnológico

| Categoría | Tecnología / Librería | Versión |
|---|---|---|
| Lenguaje | TypeScript | ^5.3.3 |
| Frontend | Next.js (Pages Router) | ^14.1.0 |
| UI | React / React DOM | ^18.2.0 |
| Estilos | Tailwind CSS + PostCSS + Autoprefixer | ^3.4.19 |
| Iconos | react-icons | ^5.5.0 |
| Exportación | xlsx (SheetJS) | ^0.18.5 |
| Backend alterno | Express | ^4.18.2 |
| Runtime dev backend | tsx (watch mode) | ^4.7.0 |
| ORM | Prisma / @prisma/client | ^5.9.1 |
| Base de datos | PostgreSQL gestionado por **Neon** | — |
| Driver DB (local) | `pg` (node-postgres) | ^8.11.3 |
| Driver DB (serverless) | `@neondatabase/serverless` | ^1.0.2 |
| Hashing de contraseñas (backend Express) | bcrypt | ^6.0.0 |
| CORS | cors | ^2.8.5 |
| Variables de entorno | dotenv | ^16.4.1 |
| Gestor de monorepo | npm workspaces | npm ≥ 9 |
| Despliegue | Vercel | — |

> Nota: el hash de contraseñas del **login del frontend** (`serverUsers.ts`) usa `crypto.createHmac` nativo de Node, no `bcrypt` — `bcrypt` solo figura como dependencia del backend Express.

### 🏗️ Arquitectura y estructura de carpetas

```
SPM/
├── apps/
│   ├── frontend/                # Next.js 14 — aplicación principal (UI + API routes)
│   │   ├── pages/                # Rutas de página (POS, dashboard, login, reportes, etc.)
│   │   │   └── api/               # API routes: auth, productos, ventas, compras, admin, migrate
│   │   ├── components/           # Componentes compartidos (Layout, AccesoDenegado)
│   │   ├── hooks/                 # useRoleGuard (RBAC), useSessionTimeout (auto-logout)
│   │   ├── lib/                   # auth.ts, apiAuth.ts, serverUsers.ts, auditoria.ts (server-only)
│   │   ├── utils/                 # formatPrecio, printTicket, exportExcel
│   │   ├── db/                    # Selector de driver de base de datos (pg vs Neon serverless)
│   │   └── middleware.ts          # Protección de rutas a nivel de Edge Runtime
│   └── backend/                  # Servidor Express independiente (opcional, usa Prisma)
│       ├── src/index.ts           # Bootstrap de Express, CORS, logging, health check
│       ├── src/routes/            # Rutas productos/ventas vía Prisma
│       ├── pages/api/             # Variante de rutas (compras, productos, reportes, ventas)
│       ├── db/                    # Config y esquema SQL de referencia
│       └── scripts/                # migrate.js, test-connection.js
├── packages/
│   ├── db/                       # Paquete @spm/db — schema.prisma + cliente Prisma exportado
│   ├── auth/                     # Paquete @spm/auth — estrategias (JWT placeholder) y guards
│   └── utils/                    # Paquete @spm/utils — helpers y validadores compartidos
├── docs/                         # Documentación técnica (arquitectura, API spec, roadmap, schema SQL de referencia)
├── scripts/                      # Scripts SQL puntuales (fix-compras-table.sql)
├── vercel.json                   # Configuración de build/deploy del monorepo en Vercel
└── package.json                  # Orquestación de workspaces (npm)
```

**Modelo de datos (Prisma — `packages/db/prisma/schema.prisma`):**

- `Producto` → tabla `productos` (código de barras único, nombre, precio, stock, categoría, fecha de ingreso; relaciones a compras, ventas e historial de precios).
- `Compra` → tabla `compras` (producto, cantidad, costo unitario, fecha).
- `Venta` → tabla `ventas` (producto, cantidad, precio unitario, total, método de pago, notas, fecha).
- `HistorialPrecio` → tabla `historial_precios` (precio anterior/nuevo por producto, con borrado en cascada).
- Tabla adicional `auditoria` (no modelada en Prisma, se escribe con SQL crudo desde `lib/auditoria.ts`).

**Nota importante sobre acceso a datos:** el frontend (`apps/frontend/pages/api/`) accede a la base de datos con **SQL crudo vía `pg`/Neon**, mientras que el backend Express (`apps/backend/src/routes/`) usa **Prisma**. Ambos apuntan al mismo esquema/base de datos, pero son dos capas de acceso independientes — hay que tenerlo en cuenta al modificar el esquema.

### ✅ Requisitos previos

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Una base de datos PostgreSQL — el proyecto está diseñado específicamente para **[Neon](https://neon.tech)** (usa su driver serverless en producción), aunque cualquier PostgreSQL compatible funcionaría en desarrollo local vía `pg`.

### ⚙️ Instalación y configuración

```bash
# 1. Clonar el repositorio
git clone https://github.com/jackson1939/spm.git
cd spm

# 2. Instalar dependencias de todo el monorepo
npm install
```

**3. Configurar variables de entorno** (ver también `ENV_SETUP.md`):

Crear `apps/frontend/.env.local` (usar `apps/frontend/.env.example` como plantilla):

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USUARIO:CONTRASEÑA@HOST.region.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=genera_una_cadena_larga_aleatoria
# Opcional — usuarios adicionales sin tocar código:
# SPM_APP_USERS_JSON=[{"username":"nuevo","password":"secreto","role":"cajero","nombre":"Mostrador"}]
```

Crear `packages/db/.env` (mismas URLs, usadas por Prisma):

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USUARIO:CONTRASEÑA@HOST.region.aws.neon.tech/neondb?sslmode=require
```

(Opcional) Crear `apps/backend/.env` si se va a usar el backend Express por separado:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
PORT=4000
FRONTEND_URL=http://localhost:3000
```

**4. Generar el cliente de Prisma y ejecutar migraciones:**

```bash
npm run db:generate
npm run db:migrate
```

### ▶️ Uso / cómo correr el proyecto

**Opción A — Solo frontend (recomendado, usa las API routes de Next.js):**

```bash
npm run dev
```

Acceder en [http://localhost:3000](http://localhost:3000). Usuarios de prueba incorporados (ver `apps/frontend/lib/serverUsers.ts` para más detalle — las contraseñas reales **no** están en el repo, solo sus hashes):

| Usuario | Rol | Descripción |
|---|---|---|
| `jefe` | `jefe` | Administrador — acceso total, incluido borrado de base de datos |
| `almacen` | `almacen` | Encargado de almacén — inventario y compras |
| `cajero` | `cajero` | Cajero — ventas / POS |
| `admin` | `jefe` | Alias de administrador |

**Opción B — Frontend + backend Express por separado:**

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

**Otros scripts disponibles (raíz del monorepo):**

| Script | Descripción |
|---|---|
| `npm run build` | Compila packages y luego ambas apps |
| `npm run build:packages` | Compila solo `packages/db`, `packages/auth`, `packages/utils` |
| `npm run build:frontend` / `build:backend` | Compila una app específica |
| `npm run lint` | Lint de todos los workspaces |
| `npm run test` | Ejecuta tests en todos los workspaces (no hay tests implementados actualmente) |
| `npm run db:generate` | Genera el cliente de Prisma |
| `npm run db:migrate` | Ejecuta migraciones en modo desarrollo |
| `npm run db:migrate:deploy` | Aplica migraciones en producción |
| `npm run db:push` | Sincroniza el esquema sin generar migración |
| `npm run db:studio` | Abre Prisma Studio (GUI de la base de datos) |

### 🔐 Variables de entorno

| Variable | Dónde | Obligatoria | Descripción |
|---|---|---|---|
| `DATABASE_URL` | frontend, `packages/db`, backend | Sí | Cadena de conexión *pooled* a PostgreSQL/Neon |
| `DATABASE_URL_UNPOOLED` | frontend, `packages/db` | Recomendada | Cadena de conexión directa (sin pooler), usada por Prisma para migraciones |
| `SESSION_SECRET` | frontend | Sí en producción/Vercel | Clave para firmar el token de sesión (HMAC). En local, si se omite, se usa un valor de solo-desarrollo |
| `SPM_APP_USERS_JSON` | frontend | No | JSON con usuarios adicionales (`username`, `password`, `role`, `nombre`, `activo`) sin modificar código |
| `PORT` | backend | No (default `4000`) | Puerto del servidor Express |
| `FRONTEND_URL` | backend | No (default `http://localhost:3000`) | Origen permitido por CORS |
| `NODE_ENV` / `VERCEL` | ambos | Automáticas | Determinan si se usa el driver serverless de Neon o el `Pool` de `pg` |

Ninguna variable con valores reales está incluida en el repositorio; todos los `.env*` están en `.gitignore`. Ver `ENV_SETUP.md` y `VERCEL_SETUP.md` para instrucciones detalladas de configuración local y en Vercel.

### 🚀 Despliegue

El frontend está pensado para desplegarse en **Vercel** como monorepo. Puntos clave documentados en `VERCEL_SETUP.md`:

- Es **obligatorio** configurar el *Root Directory* del proyecto en Vercel como `apps/frontend` para que Tailwind CSS compile correctamente.
- Las variables `DATABASE_URL`, `DATABASE_URL_UNPOOLED` y `SESSION_SECRET` deben configurarse en el dashboard de Vercel (Production, Preview y Development).
- Las migraciones de Prisma deben ejecutarse manualmente (`npm run db:migrate`) antes de usar la aplicación en producción, ya que Vercel no las corre automáticamente.

### 📊 Estado del proyecto / roadmap

Según `docs/roadmap.md`, el proyecto define 4 fases; en base al código actual:

- **Fase 1 — Configuración inicial:** ✅ estructura del monorepo, ✅ base de datos configurada, ✅ autenticación básica implementada (más completa que "básica": incluye RBAC, auditoría y expiración de sesión).
- **Fase 2 — Módulos core:** ✅ gestión de productos, ✅ POS/ventas, ✅ gestión de compras — todos implementados en código, aunque el roadmap los sigue marcando como pendientes.
- **Fase 3 — Reportes y analytics:** ⚠️ parcial — existen páginas y endpoints de reportes, pero el roadmap no los marca como completos y no se auditó su cobertura funcional a fondo.
- **Fase 4 — Mejoras futuras:** ⏳ pendiente — autenticación de dos factores, optimización de rendimiento y testing automatizado (no hay suite de tests en el repo).

En resumen, el `roadmap.md` del repositorio está desactualizado respecto al código real: varias features marcadas como pendientes ya están implementadas. Se recomienda a los mantenedores actualizar ese archivo.

### 📄 Licencia

El repositorio **no incluye un archivo `LICENSE`**. Por lo tanto:

**Todos los derechos reservados — proyecto de jackson1939.** No se otorga licencia de uso, copia, modificación o distribución salvo autorización expresa del autor.

### 👤 Autor / contacto

- **GitHub:** [@jackson1939](https://github.com/jackson1939)
- **Repositorio:** [github.com/jackson1939/spm](https://github.com/jackson1939/spm)
- Repositorio relacionado (mismo autor, posible proyecto emparentado por nombre/propósito): [jackson1939/AXIS-SPM-SS](https://github.com/jackson1939/AXIS-SPM-SS)

---

<a name="english"></a>

## English

### 📖 Overview

**SPM** (Sistema de Punto de Venta / Point-of-Sale System) is a business management application for small retail businesses (kiosks, mini-markets, corner stores): inventory control, POS checkout, purchases from suppliers, price history, reports, and a store configuration panel. The codebase is written almost entirely in Spanish (table names, fields, UI copy) and is designed to be operated by non-technical staff, with different access levels per employee role.

The code contains two commercial brand names used for the landing page and the default store configuration: **"KIOSKO ROJO"** (home page, attributed to "ALLDRIX FOUNDRY") and **"VEROKAI POS"** (default store name in `configuracion.tsx`). This suggests the codebase is a POS template reused/rebranded across different clients or brands — a common pattern when the same developer maintains several similar POS repos (for instance, [`jackson1939/AXIS-SPM-SS`](https://github.com/jackson1939/AXIS-SPM-SS) also exists under the same author and appears related by name and purpose; no direct reference or cross-dependency to it was found **within this repository**).

**Maturity level:** a working project in active development / advanced MVP. It has real authentication, role-based access control, audit logging, Excel export, receipt printing, and is deployed on Vercel — but the git history has been squashed to a single commit (`PARCHE DE SEGURIDAD 1` / "SECURITY PATCH 1"), indicating a recent security patch was applied (possible prior credential exposure, see `ENV_SETUP.md`) and that the repository does not retain its full history. No automated tests were found (`npm run test` exists as a script, but there are no test files in the repo).

### ✨ Key features

- **Inventory management (products):** create, edit, delete and list products with a unique barcode, name, price, stock, category and intake date.
- **Point of sale (POS):** record sales by product and quantity, payment methods, notes, total calculation, and receipt printing (`utils/printTicket.ts`) with change-due logic.
- **Purchases from suppliers:** record purchases with unit cost and stock updates (`pages/compras.tsx`, `pages/api/compras.ts`).
- **Price history:** every price change on a product is logged (`HistorialPrecio` model), allowing price variations to be audited over time.
- **Barcode scan/lookup:** a `scan.tsx` page to find products by their barcode.
- **Reports:** sales/inventory report views (`pages/reportes.tsx`; `docs/api-spec.md` also defines report endpoints on the Express backend).
- **Operational dashboard:** today vs. yesterday sales, total products, low-stock alerts and monthly purchases, with data export to Excel (`xlsx` library).
- **Custom authentication and sessions (no third-party auth library):**
  - Username/password login, passwords stored as **HMAC-SHA256 hash + salt** (never in plain text), constant-time comparison (`crypto.timingSafeEqual`) to mitigate timing attacks.
  - HMAC-signed session in an `HttpOnly`, `SameSite=Lax` cookie, `Secure` in production, 12-hour expiration.
  - Additional users configurable without touching code via the `SPM_APP_USERS_JSON` environment variable.
  - Automatic client-side logout on inactivity (17 minutes) (`useSessionTimeout`), meant to avoid exhausting the Neon connection pool.
- **Role-based access control (RBAC):** three roles — `jefe` (boss/admin), `almacen` (warehouse), `cajero` (cashier) — enforced both server-side (`middleware.ts`, `requireAuth`) and client-side (`useRoleGuard`, with a `localStorage` fallback if the network fails).
- **Action auditing:** every sensitive action (login, logout, sale created, purchase created, product created/edited/deleted, config updated, migration run, database cleared) is logged to an `auditoria` table, silently (a failed audit write never blocks the main operation).
- **Configuration panel:** store name/details, currency symbol, low-stock threshold, credentials, printer and receipt footer, all configurable (`pages/configuracion.tsx`).
- **Admin "wipe database" endpoint:** `/api/admin/clear-database`, restricted to the `jefe` role, requiring explicit confirmation in the request body (`"BORRAR TODO"`) — an irreversible, audited action.
- **Dual database access strategy depending on environment:**
  - On **Vercel/production**, uses the `@neondatabase/serverless` HTTP driver, suited for serverless functions.
  - In **local development**, uses a traditional `pg` `Pool` (TCP), with automatic fallback to Neon if the pool fails.
- **Light/dark theme**, persisted in `localStorage` on the landing page.
- **Standalone Express backend (optional):** exposes part of the same API (`productos`, `ventas`, `compras`, `reportes`) using **Prisma ORM** instead of raw SQL, useful as a Vercel-decoupled alternative or for future integrations.

### 🛠️ Tech stack

| Category | Technology / Library | Version |
|---|---|---|
| Language | TypeScript | ^5.3.3 |
| Frontend | Next.js (Pages Router) | ^14.1.0 |
| UI | React / React DOM | ^18.2.0 |
| Styling | Tailwind CSS + PostCSS + Autoprefixer | ^3.4.19 |
| Icons | react-icons | ^5.5.0 |
| Export | xlsx (SheetJS) | ^0.18.5 |
| Alternate backend | Express | ^4.18.2 |
| Backend dev runtime | tsx (watch mode) | ^4.7.0 |
| ORM | Prisma / @prisma/client | ^5.9.1 |
| Database | PostgreSQL, managed by **Neon** | — |
| DB driver (local) | `pg` (node-postgres) | ^8.11.3 |
| DB driver (serverless) | `@neondatabase/serverless` | ^1.0.2 |
| Password hashing (Express backend) | bcrypt | ^6.0.0 |
| CORS | cors | ^2.8.5 |
| Env vars | dotenv | ^16.4.1 |
| Monorepo manager | npm workspaces | npm ≥ 9 |
| Deployment | Vercel | — |

> Note: password hashing for the **frontend login** (`serverUsers.ts`) uses Node's native `crypto.createHmac`, not `bcrypt` — `bcrypt` only appears as a dependency of the Express backend.

### 🏗️ Architecture and folder structure

```
SPM/
├── apps/
│   ├── frontend/                # Next.js 14 — main app (UI + API routes)
│   │   ├── pages/                # Page routes (POS, dashboard, login, reports, etc.)
│   │   │   └── api/               # API routes: auth, products, sales, purchases, admin, migrate
│   │   ├── components/           # Shared components (Layout, AccesoDenegado)
│   │   ├── hooks/                 # useRoleGuard (RBAC), useSessionTimeout (auto-logout)
│   │   ├── lib/                   # auth.ts, apiAuth.ts, serverUsers.ts, auditoria.ts (server-only)
│   │   ├── utils/                 # formatPrecio, printTicket, exportExcel
│   │   ├── db/                    # Database driver selector (pg vs. Neon serverless)
│   │   └── middleware.ts          # Route protection at the Edge Runtime level
│   └── backend/                  # Standalone Express server (optional, uses Prisma)
│       ├── src/index.ts           # Express bootstrap, CORS, logging, health check
│       ├── src/routes/            # Products/sales routes via Prisma
│       ├── pages/api/             # Alternate route set (purchases, products, reports, sales)
│       ├── db/                    # Config and reference SQL schema
│       └── scripts/                # migrate.js, test-connection.js
├── packages/
│   ├── db/                       # @spm/db package — schema.prisma + exported Prisma client
│   ├── auth/                     # @spm/auth package — strategies (JWT placeholder) and guards
│   └── utils/                    # @spm/utils package — shared helpers and validators
├── docs/                         # Technical docs (architecture, API spec, roadmap, reference SQL schema)
├── scripts/                      # One-off SQL scripts (fix-compras-table.sql)
├── vercel.json                   # Monorepo build/deploy configuration for Vercel
└── package.json                  # npm workspaces orchestration
```

**Data model (Prisma — `packages/db/prisma/schema.prisma`):**

- `Producto` → `productos` table (unique barcode, name, price, stock, category, intake date; relations to purchases, sales and price history).
- `Compra` → `compras` table (product, quantity, unit cost, date).
- `Venta` → `ventas` table (product, quantity, unit price, total, payment method, notes, date).
- `HistorialPrecio` → `historial_precios` table (old/new price per product, cascade delete).
- Additional `auditoria` table (not modeled in Prisma, written via raw SQL from `lib/auditoria.ts`).

**Important note on data access:** the frontend (`apps/frontend/pages/api/`) accesses the database with **raw SQL via `pg`/Neon**, while the Express backend (`apps/backend/src/routes/`) uses **Prisma**. Both point at the same schema/database but are two independent access layers — keep this in mind when changing the schema.

### ✅ Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- A PostgreSQL database — the project is specifically designed for **[Neon](https://neon.tech)** (uses its serverless driver in production), though any compatible PostgreSQL instance works for local development via `pg`.

### ⚙️ Installation and setup

```bash
# 1. Clone the repository
git clone https://github.com/jackson1939/spm.git
cd spm

# 2. Install monorepo dependencies
npm install
```

**3. Configure environment variables** (see also `ENV_SETUP.md`):

Create `apps/frontend/.env.local` (use `apps/frontend/.env.example` as a template):

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USER:PASSWORD@HOST.region.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=generate_a_long_random_string
# Optional — extra users without touching code:
# SPM_APP_USERS_JSON=[{"username":"new","password":"secret","role":"cajero","nombre":"Front desk"}]
```

Create `packages/db/.env` (same URLs, used by Prisma):

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USER:PASSWORD@HOST.region.aws.neon.tech/neondb?sslmode=require
```

(Optional) Create `apps/backend/.env` if the Express backend will be used separately:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
PORT=4000
FRONTEND_URL=http://localhost:3000
```

**4. Generate the Prisma client and run migrations:**

```bash
npm run db:generate
npm run db:migrate
```

### ▶️ Usage / running the project

**Option A — Frontend only (recommended, uses Next.js API routes):**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Built-in test users (see `apps/frontend/lib/serverUsers.ts` for details — real passwords are **not** in the repo, only their hashes):

| User | Role | Description |
|---|---|---|
| `jefe` | `jefe` | Admin — full access, including database wipe |
| `almacen` | `almacen` | Warehouse manager — inventory and purchases |
| `cajero` | `cajero` | Cashier — sales / POS |
| `admin` | `jefe` | Admin alias |

**Option B — Frontend + separate Express backend:**

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

**Other available scripts (monorepo root):**

| Script | Description |
|---|---|
| `npm run build` | Builds packages, then both apps |
| `npm run build:packages` | Builds only `packages/db`, `packages/auth`, `packages/utils` |
| `npm run build:frontend` / `build:backend` | Builds a specific app |
| `npm run lint` | Lints all workspaces |
| `npm run test` | Runs tests across workspaces (no tests currently implemented) |
| `npm run db:generate` | Generates the Prisma client |
| `npm run db:migrate` | Runs migrations in dev mode |
| `npm run db:migrate:deploy` | Deploys migrations to production |
| `npm run db:push` | Syncs the schema without creating a migration |
| `npm run db:studio` | Opens Prisma Studio (database GUI) |

### 🔐 Environment variables

| Variable | Where | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | frontend, `packages/db`, backend | Yes | Pooled PostgreSQL/Neon connection string |
| `DATABASE_URL_UNPOOLED` | frontend, `packages/db` | Recommended | Direct (non-pooled) connection string, used by Prisma for migrations |
| `SESSION_SECRET` | frontend | Yes in production/Vercel | Key used to sign the session token (HMAC). Locally, a dev-only fallback value is used if omitted |
| `SPM_APP_USERS_JSON` | frontend | No | JSON with extra users (`username`, `password`, `role`, `nombre`, `activo`) without modifying code |
| `PORT` | backend | No (default `4000`) | Express server port |
| `FRONTEND_URL` | backend | No (default `http://localhost:3000`) | CORS-allowed origin |
| `NODE_ENV` / `VERCEL` | both | Automatic | Determine whether the Neon serverless driver or the `pg` `Pool` is used |

No variable with real values is included in the repository; all `.env*` files are in `.gitignore`. See `ENV_SETUP.md` and `VERCEL_SETUP.md` for detailed local and Vercel setup instructions.

### 🚀 Deployment

The frontend is designed to be deployed on **Vercel** as a monorepo. Key points documented in `VERCEL_SETUP.md`:

- Setting the Vercel project's **Root Directory** to `apps/frontend` is **mandatory** for Tailwind CSS to compile correctly.
- `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and `SESSION_SECRET` must be configured in the Vercel dashboard (Production, Preview and Development).
- Prisma migrations must be run manually (`npm run db:migrate`) before using the app in production, since Vercel does not run them automatically.

### 📊 Project status / roadmap

Per `docs/roadmap.md`, the project defines 4 phases; based on the actual code:

- **Phase 1 — Initial setup:** ✅ monorepo structure, ✅ database configured, ✅ basic auth implemented (actually more complete than "basic": includes RBAC, auditing and session expiration).
- **Phase 2 — Core modules:** ✅ product management, ✅ POS/sales, ✅ purchase management — all implemented in code, though the roadmap still lists them as pending.
- **Phase 3 — Reports and analytics:** ⚠️ partial — report pages and endpoints exist, but the roadmap doesn't mark them complete and their functional coverage was not deeply audited.
- **Phase 4 — Future improvements:** ⏳ pending — two-factor authentication, performance optimization, and automated testing (no test suite exists in the repo).

In short, the repository's `roadmap.md` is out of date relative to the actual code: several features marked as pending are already implemented. Maintainers are encouraged to update that file.

### 📄 License

The repository **does not include a `LICENSE` file**. Therefore:

**All rights reserved — a project by jackson1939.** No license to use, copy, modify or distribute is granted without the author's express permission.

### 👤 Author / contact

- **GitHub:** [@jackson1939](https://github.com/jackson1939)
- **Repository:** [github.com/jackson1939/spm](https://github.com/jackson1939/spm)
- Related repository (same author, possibly related by name/purpose): [jackson1939/AXIS-SPM-SS](https://github.com/jackson1939/AXIS-SPM-SS)

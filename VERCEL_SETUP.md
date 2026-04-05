# Configuración de Vercel para SPM Monorepo

## ⚠️ PROBLEMA CRÍTICO
El build se completa en 48ms (no construye nada) y muestra error 404.

## ✅ SOLUCIÓN OBLIGATORIA

### Paso 1: Configurar Root Directory en Vercel Dashboard (REQUERIDO)

**Esto es CRÍTICO y debe hacerse manualmente:**

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en tu proyecto **SPM**
3. Ve a **Settings** (Configuración)
4. En el menú lateral, selecciona **General**
5. Desplázate hasta la sección **Root Directory**
6. **Haz clic en "Edit"** y escribe: `apps/frontend`
7. **Guarda los cambios** (Save)

**Sin este paso, Tailwind NO se compilará correctamente.**

### Paso 2: Verificar vercel.json

El archivo `vercel.json` en la raíz está configurado para:
- Build Command: `npm run build` (construye todo el monorepo)
- Output Directory: `apps/frontend/.next`
- Framework: `nextjs`

### Paso 3: Hacer un nuevo deploy

Después de configurar el Root Directory:
1. Haz un nuevo commit y push, O
2. Ve a Vercel Dashboard → Deployments → "Redeploy" (último deployment)

## 🔍 Verificación

Después de configurar correctamente, el build debería:
1. ✅ Instalar todas las dependencias del monorepo
2. ✅ Compilar los packages (`@spm/db`, `@spm/auth`, `@spm/utils`)
3. ✅ Compilar el frontend con Tailwind CSS
4. ✅ Generar los estilos CSS en `.next/static/css/`

## 🐛 Si el problema persiste

### Verificar en los logs de build:

1. Busca en los logs: `Creating an optimized production build`
2. Deberías ver que se compilan los archivos CSS
3. Si ves errores de Tailwind, verifica:
   - `tailwind.config.js` existe en `apps/frontend/`
   - `postcss.config.js` existe en `apps/frontend/`
   - `globals.css` tiene las directivas `@tailwind`

### Verificar en el navegador (F12):

1. Abre la pestaña **Network**
2. Recarga la página
3. Busca archivos CSS (filtra por "CSS")
4. Deberías ver un archivo como `_app-[hash].css`
5. Si NO aparece, Tailwind no se está compilando

### Solución alternativa si Root Directory no funciona:

Si configurar Root Directory causa problemas, puedes:
1. Mover `vercel.json` a `apps/frontend/vercel.json`
2. Configurar el proyecto para que apunte directamente a `apps/frontend`

## 📝 Notas Importantes

- **Root Directory es OBLIGATORIO** para monorepos en Vercel
- Sin Root Directory, Vercel no encuentra `tailwind.config.js` y `postcss.config.js`
- El build puede completarse exitosamente pero sin estilos CSS generados

## 🔐 Configuración de Variables de Entorno en Vercel (CRÍTICO)

**IMPORTANTE**: Para que la aplicación funcione correctamente en producción, debes configurar las variables de entorno en Vercel.

### Paso 1: Configurar Variables de Entorno

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en tu proyecto **SPM**
3. Ve a **Settings** (Configuración)
4. En el menú lateral, selecciona **Environment Variables**
5. Agrega las siguientes variables:

#### Variables Requeridas:

**`DATABASE_URL`** (Production, Preview, Development) — pega la URL **pooled** desde el panel de Neon (no la subas al repositorio).
```
postgresql://USUARIO:CONTRASEÑA@HOST-pooler.region.aws.neon.tech/neondb?sslmode=require
```

**`DATABASE_URL_UNPOOLED`** (Production, Preview, Development) - Opcional pero recomendado
```
postgresql://USUARIO:CONTRASEÑA@HOST.region.aws.neon.tech/neondb?sslmode=require
```

**`SESSION_SECRET`** (Production, Preview, Development) — cadena larga y aleatoria (firma de cookies de sesión). Obligatoria en Vercel.
```
(usa openssl rand -hex 32 o similar)
```

### Paso 2: Verificar que las Variables Estén Configuradas

1. Después de agregar las variables, haz un nuevo deploy
2. Verifica en los logs de build que no haya errores de conexión a la base de datos
3. Prueba la aplicación en producción:
   - https://spm-n7pe0s4gq-bolivianet-market.vercel.app/productos
   - https://spm-n7pe0s4gq-bolivianet-market.vercel.app/compras

### Paso 3: Ejecutar Migraciones de Base de Datos

**IMPORTANTE**: Antes de usar la aplicación en producción, debes ejecutar las migraciones de Prisma para crear las tablas necesarias.

1. **Opción A: Desde tu máquina local** (recomendado)
   ```bash
   cd C:\SPM
   npm run db:migrate
   ```

2. **Opción B: Desde Vercel** (si tienes acceso a la consola)
   - Ve a tu proyecto en Vercel Dashboard
   - Abre la consola del deployment
   - Ejecuta: `npm run db:migrate`

### ⚠️ Solución de Problemas

**Error: "Error interno del servidor" en productos/compras**
- Verifica que `DATABASE_URL` esté configurada correctamente en Vercel
- Verifica que las tablas `productos` y `compras` existan en la base de datos
- Ejecuta las migraciones: `npm run db:migrate`

**Error: "Compra guardada localmente"**
- Esto significa que la API `/api/compras` no está funcionando
- Verifica que la ruta de API exista: `apps/frontend/pages/api/compras.ts`
- Verifica que `DATABASE_URL` esté configurada en Vercel
- Verifica que la tabla `compras` exista en la base de datos

**Error: "Missing script: db:migrate"**
- Ya está solucionado: el script está agregado en `apps/backend/package.json`
- Ejecuta desde la raíz del monorepo: `npm run db:migrate`


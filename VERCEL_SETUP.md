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


# Configuración de Vercel para SPM Monorepo

## Problema
En producción, Tailwind CSS no se está compilando correctamente, mostrando la página sin estilos.

## Solución

### Opción 1: Configurar en el Dashboard de Vercel (Recomendado)

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** → **General**
3. En la sección **Root Directory**, selecciona: `apps/frontend`
4. Guarda los cambios

### Opción 2: Usar vercel.json (Ya configurado)

El archivo `vercel.json` en la raíz ya está configurado para:
- Build Command: `npm run build:frontend`
- Output Directory: `apps/frontend/.next`
- Framework: `nextjs`

## Verificación

Después de configurar, el build debería:
1. Instalar todas las dependencias del monorepo
2. Compilar los packages necesarios
3. Compilar el frontend con Tailwind CSS
4. Generar los estilos correctamente

## Si el problema persiste

1. Verifica que `tailwind.config.js` tenga los paths correctos
2. Verifica que `postcss.config.js` esté configurado
3. Verifica que `globals.css` tenga las directivas `@tailwind`
4. Revisa los logs de build en Vercel para ver errores específicos


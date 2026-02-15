/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@spm/db', '@spm/auth', '@spm/utils'],
  // Asegurar que CSS se compile correctamente
  swcMinify: true,
  // Optimizaciones para producción
  productionBrowserSourceMaps: false,
  // Configuración de TypeScript
  typescript: {
    // Ignorar errores de TypeScript durante el build (solo advertencias)
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig


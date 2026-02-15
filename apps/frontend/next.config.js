/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@spm/db', '@spm/auth', '@spm/utils'],
  // Asegurar que CSS se compile correctamente
  swcMinify: true,
  // Optimizaciones para producción
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig


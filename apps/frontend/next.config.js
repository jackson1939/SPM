/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@spm/db', '@spm/auth', '@spm/utils'],
}

module.exports = nextConfig


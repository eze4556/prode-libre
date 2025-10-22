/** @type {import('next').NextConfig} */
const nextConfig = {
  // Solo usar export para builds de producción
  output: 'export', // Para generar archivos estáticos
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

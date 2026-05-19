/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force all pages to be dynamic (server-rendered) — required for API fetches
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

export default nextConfig

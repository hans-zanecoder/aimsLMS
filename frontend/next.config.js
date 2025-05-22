/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/:path*` : 'http://127.0.0.1:5002/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/:path*` : 'http://127.0.0.1:5002/uploads/:path*',
      }
    ];
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true // Only use during development
  },
  eslint: {
    ignoreDuringBuilds: true // Only use during development
  },
  output: 'standalone',
};

module.exports = nextConfig;
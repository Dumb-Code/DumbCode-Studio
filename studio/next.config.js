/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");

const nextConfig = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com']
  },
  eslint: {
    dirs: ['pages', 'src', 'lib', 'tests'],
  },
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },

  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: `/:path*`,
      },

      {
        source: '/docs',
        destination: `${process.env.DOCS_URL}/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `${process.env.DOCS_URL}/docs/:path*`,
      },
    ]
  },
})

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const withPlugins = require('next-compose-plugins');
const withPWA = require("next-pwa");
const withTM = require("next-transpile-modules")(["@dumbcode/shared"]);

module.exports = withPlugins([
  withTM, withPWA,
], {
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
        destination: `http://localhost:3001/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `http://localhost:3001/docs/:path*`,
      },
    ]
  },
})

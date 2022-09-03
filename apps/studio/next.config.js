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

  rewrites: [
    {
      source: '/:path*',
      destination: `/:path*`,
    },

    {
      "__comment": "This will only be ran on dev. Production will use the vercel.json rewrites",
      source: '/docs',
      destination: `http://localhost:3001/docs`,
    },
    {
      source: '/docs/:path*',
      destination: `http://localhost:3001/docs/:path`,
    },
  ]

})

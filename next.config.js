/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");

const nextConfig = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com']
  },
  eslint: {
    dirs: ['pages', 'src'],
  },
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },
})

module.exports = nextConfig

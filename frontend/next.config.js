/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable static optimization for dynamic routes
  experimental: {
  },
};

module.exports = nextConfig; 
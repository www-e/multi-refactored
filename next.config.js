const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@elevenlabs/react'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/healthz',
        destination: '/api/healthz',
      },
    ];
  },
}

module.exports = withBundleAnalyzer(nextConfig) 
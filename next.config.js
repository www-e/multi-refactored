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
    // CRITICAL: Proxy webhooks and specific backend routes directly
    // Using process.env.BACKEND_URL is crucial here. 
    // In Docker, this is usually 'http://backend:8000'
    const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    
    return [
      {
        source: '/healthz',
        destination: '/api/healthz',
      },
      // 1. Forward the ElevenLabs Webhook directly to backend
      // This solves the "Missing Data" issue
      {
        source: '/voice/post_call',
        destination: `${BACKEND}/voice/post_call`,
      },
      // 2. Forward manual process triggers if needed
      {
        source: '/elevenlabs/:path*',
        destination: `${BACKEND}/elevenlabs/:path*`,
      }
    ];
  },
}

module.exports = withBundleAnalyzer(nextConfig)
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Enable transpilation for modules that export ES modules
  transpilePackages: ['zustand'],
  
  // Configure TypeScript handling
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configure ESLint handling
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Environment variables visible to browser
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  },

  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // Redirect old vite-based routes if needed
  async redirects() {
    return [];
  },

  // Rewrites for API proxying if needed
  async rewrites() {
    return [];
  },

  // Configure webpack if needed
  webpack: (config) => {
    config.externals.push({
      'ws': 'ws',
    });
    return config;
  },
};

export default nextConfig;

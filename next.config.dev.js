/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable detailed error messages
  reactStrictMode: true,
  
  // Enable source maps for better debugging
  productionBrowserSourceMaps: true,
  
  // Enable detailed error overlay
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Enable experimental features for better debugging
  experimental: {
    // Enable detailed logging
    logging: {
      level: 'verbose',
      fetches: {
        fullUrl: true,
      },
    },
  },
  
  // Enable detailed logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Enable detailed error pages
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Enable webpack logging
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.infrastructureLogging = {
        level: 'verbose',
        debug: true,
      };
      config.stats = 'verbose';
    }
    return config;
  },
}

module.exports = nextConfig 
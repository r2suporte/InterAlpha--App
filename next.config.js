/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  // removed unsupported experimental flags for compatibility with the
  // installed Next.js version. If you need experimental options, add them
  // behind a feature-flag or verify compatibility with your Next.js version.
  serverExternalPackages: ['bcryptjs'],
  eslint: {
    // Durante o build, apenas erros fatais bloqueiam
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Não ignorar erros de TypeScript no build
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

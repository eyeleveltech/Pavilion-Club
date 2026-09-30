/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pavilion/core', '@pavilion/db'],
  serverExternalPackages: ['@node-rs/argon2', 'pg'],
  async redirects() {
    return [
      {
        source: '/cancellation',
        destination: '/cancellation-policy',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

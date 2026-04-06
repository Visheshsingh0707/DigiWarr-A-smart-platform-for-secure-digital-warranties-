/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add any Next.js configurations here
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'crypto'],
  },
};

export default nextConfig;

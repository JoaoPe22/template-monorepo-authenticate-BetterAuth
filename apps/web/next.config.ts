import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // O schema do banco vem do apps/api (fonte única) como TypeScript cru
  transpilePackages: ['@templateMonorepo/api'],
}

export default nextConfig

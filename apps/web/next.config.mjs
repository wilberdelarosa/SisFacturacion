import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  // Force output tracing to use the monorepo root so Next.js ignores other user-level lockfiles
  outputFileTracingRoot: path.join(process.cwd(), '..', '..'),
};

export default nextConfig;

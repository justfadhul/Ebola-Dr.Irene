/** @type {import('next').NextConfig} */

// For GitHub Pages project sites the app is served from /<repo>/.
// Set BASE_PATH at build time (e.g. "/ipc_rat_dashboard") in the deploy workflow.
const basePath = process.env.BASE_PATH || '';

const nextConfig = {
  output: 'export', // fully static build for GitHub Pages — no server runtime
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true }, // no image optimization server in a static export
  trailingSlash: true,
  reactStrictMode: true,
  // Exposed to the client so the service-worker registration can prefix the
  // sw.js path/scope correctly under a GitHub Pages sub-path (empty on Vercel).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;

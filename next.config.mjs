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
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Standalone output is ONLY for Docker/Cloud Run (self-hosting). It changes
  // the .next structure in a way that conflicts with Vercel's own file tracing
  // (causing a missing next-server.js.nft.json error), so we enable it only
  // when BUILD_STANDALONE=1 — which the Dockerfile sets, and Vercel does not.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" } : {}),
};

export default nextConfig;

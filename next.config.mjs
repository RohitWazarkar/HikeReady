/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Produce a minimal, self-contained server build for Docker/Cloud Run.
  // Outputs .next/standalone with only the files needed to run.
  output: "standalone",
};

export default nextConfig;

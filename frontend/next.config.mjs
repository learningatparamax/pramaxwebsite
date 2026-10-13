/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Self-contained server in .next/standalone for Azure App Service
  // (started with `node server.js`; see DEPLOYMENT.md).
  output: "standalone",
};

export default nextConfig;

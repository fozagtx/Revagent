/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  transpilePackages: ["@revagent/shared"],
  async rewrites() {
    const api = process.env.API_BASE_URL ?? "http://localhost:4000";
    return [
      { source: "/api/:path*", destination: `${api}/api/:path*` },
    ];
  },
};
export default nextConfig;

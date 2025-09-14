/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  webpack(config) {
    config.optimization.minimize = false;
    return config;
  },
  productionBrowserSourceMaps: true,

  async rewrites() {
    return [
      {
        source: "/api/hls/:id.m3u8",
        destination: "/api/hls?id=:id",
      },
    ];
  },
};

export default nextConfig;

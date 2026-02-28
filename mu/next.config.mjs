/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.optimization.minimize = false;
    return config;
  },
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

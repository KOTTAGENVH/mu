/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.optimization.minimize = true;
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
          {
            key: "Strict-Transport-Security", //HSTS
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

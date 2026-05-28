/** @type {import('next').NextConfig} */
const nextConfig = {
  // webpack(config) {
  //   config.optimization.minimize = true;
  //   return config;
  // },
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
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Prevents MIME type sniffing
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https://muimg.nowenkottage.com; " +
              "media-src 'self' https://musiccdn.nowenkottage.com;", 
          },
        ],
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config) {
      config.optimization.minimize = false; 
      return config;
    },
    productionBrowserSourceMaps: true,
  
  };
  
  export default nextConfig;
  
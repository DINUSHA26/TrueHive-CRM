/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    if (!process.env.BACKEND_PROXY_URL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_PROXY_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;

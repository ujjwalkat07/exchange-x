/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // eslint-disable-next-line no-undef
    const backendUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:8008";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;


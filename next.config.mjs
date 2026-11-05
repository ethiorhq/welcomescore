/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "alt-svc",
            value: "clear",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/gatekpt-site", destination: "/", permanent: true },
      { source: "/gatekpt-site/:path*", destination: "/", permanent: true },
      { source: "/gate-kpt", destination: "/", permanent: true },
      { source: "/gate-kpt/:path*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;

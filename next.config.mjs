const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/gatekpt-site", destination: "/", permanent: true },
      { source: "/gatekpt-site/:path*", destination: "/", permanent: true },
      { source: "/gate-kpt", destination: "/", permanent: true },
      { source: "/gate-kpt/:path*", destination: "/", permanent: true },
      { source: "/notes/the-mental-time-trap", destination: "/notes/the-trap-of-time", permanent: true },
      { source: "/log/the-mental-time-trap", destination: "/log/the-trap-of-time", permanent: true },
      { source: "/es/notes/the-mental-time-trap", destination: "/es/notes/the-trap-of-time", permanent: true },
      { source: "/es/log/the-mental-time-trap", destination: "/es/log/the-trap-of-time", permanent: true },
    ];
  },
};

export default nextConfig;

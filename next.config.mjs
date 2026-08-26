const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      { source: "/gatekpt-site", destination: "/", permanent: true },
      { source: "/gatekpt-site/:path*", destination: "/", permanent: true },
      { source: "/gate-kpt", destination: "/", permanent: true },
      { source: "/gate-kpt/:path*", destination: "/", permanent: true },
      { source: "/notes", destination: "/log", statusCode: 301 },
      { source: "/notes/:slug", destination: "/log/:slug", statusCode: 301 },
      { source: "/es/notes", destination: "/es/log", statusCode: 301 },
      { source: "/es/notes/:slug", destination: "/es/log/:slug", statusCode: 301 },
      { source: "/log/the-only-thing-paying-attention", destination: "/log/wall-e", statusCode: 301 },
      { source: "/log/the-place-you-started", destination: "/log/the-geometry-of-attention", statusCode: 301 },
      { source: "/log/the-mental-time-trap", destination: "/log/the-geometry-of-attention", statusCode: 301 },
      { source: "/log/the-trap-of-time", destination: "/log/the-geometry-of-attention", statusCode: 301 },
      { source: "/es/log/the-mental-time-trap", destination: "/es/log/the-geometry-of-attention", statusCode: 301 },
      { source: "/es/log/the-trap-of-time", destination: "/es/log/the-geometry-of-attention", statusCode: 301 },
      { source: "/log/you-are-not-a-runner", destination: "/log/the-signal-and-the-noise", statusCode: 301 },
      { source: "/es/log/you-are-not-a-runner", destination: "/es/log/the-signal-and-the-noise", statusCode: 301 },
    ];
  },
};

export default nextConfig;

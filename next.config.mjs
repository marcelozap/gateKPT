const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      { source: "/gatekpt-site", destination: "/", permanent: true },
      { source: "/gatekpt-site/:path*", destination: "/", permanent: true },
      { source: "/gate-kpt", destination: "/", permanent: true },
      { source: "/gate-kpt/:path*", destination: "/", permanent: true },
      { source: "/log", destination: "/notes", permanent: true },
      { source: "/log/:slug", destination: "/notes/:slug", permanent: true },
      { source: "/es/log", destination: "/es/notes", permanent: true },
      { source: "/es/log/:slug", destination: "/es/notes/:slug", permanent: true },
      { source: "/notes/the-only-thing-paying-attention", destination: "/notes/wall-e", permanent: true },
      { source: "/notes/the-place-you-started", destination: "/notes/the-geometry-of-attention", permanent: true },
      { source: "/notes/the-mental-time-trap", destination: "/notes/the-geometry-of-attention", permanent: true },
      { source: "/notes/the-trap-of-time", destination: "/notes/the-geometry-of-attention", permanent: true },
      { source: "/es/notes/the-mental-time-trap", destination: "/es/notes/the-geometry-of-attention", permanent: true },
      { source: "/es/notes/the-trap-of-time", destination: "/es/notes/the-geometry-of-attention", permanent: true },
      { source: "/notes/you-are-not-a-runner", destination: "/notes/the-signal-and-the-noise", permanent: true },
      { source: "/es/notes/you-are-not-a-runner", destination: "/es/notes/the-signal-and-the-noise", permanent: true },
    ];
  },
};

export default nextConfig;

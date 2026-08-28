import type { MetadataRoute } from "next";
import { getEntries } from "@/xiv/content";
import { getSiteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const staticRoutes = ["", "/es", "/xiv", "/malosound", "/green-machine", "/log", "/es/log"];
  const noteRoutes = getEntries("en").flatMap((entry) => [
    `/log/${entry.slug}`,
    `/es/log/${entry.slug}`,
  ]);

  return [...staticRoutes, ...noteRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.includes("/log/") ? "monthly" : "weekly",
    priority: route === "" ? 1 : route.includes("/log/") ? 0.7 : 0.8,
  }));
}

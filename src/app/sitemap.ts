import type { MetadataRoute } from "next";
import { getEntries } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const staticRoutes = ["", "/es", "/gatekpt", "/notes", "/es/notes"];
  const noteRoutes = getEntries("en").flatMap((entry) => [
    `/notes/${entry.slug}`,
    `/es/notes/${entry.slug}`,
  ]);

  return [...staticRoutes, ...noteRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.includes("/notes/") ? "monthly" : "weekly",
    priority: route === "" ? 1 : route.includes("/notes/") ? 0.7 : 0.8,
  }));
}

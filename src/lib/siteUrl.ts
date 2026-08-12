/**
 * Canonical origin for metadataBase / Open Graph.
 * Defaults to the public domain so aliased preview builds still produce
 * shareable social URLs.
 */
const PUBLIC_SITE_URL = "https://www.gatekpt.ai";

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const withScheme = /^https?:\/\//i.test(explicit) ? explicit : `https://${explicit}`;
    return withScheme.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001";
  }

  return PUBLIC_SITE_URL;
}

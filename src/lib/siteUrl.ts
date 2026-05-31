/**
 * Canonical origin for metadataBase / Open Graph.
 * NEXT_PUBLIC_SITE_URL (https, no trailing slash) → Vercel VERCEL_URL → localhost.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const withScheme = /^https?:\/\//i.test(explicit) ? explicit : `https://${explicit}`;
    return withScheme.replace(/\/+$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host.replace(/\/+$/, "")}`;
  }

  return "http://localhost:3001";
}

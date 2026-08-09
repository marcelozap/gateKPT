const PRODUCTION_ORIGIN = "https://www.gatekpt.ai";

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const withScheme = /^https?:\/\//i.test(explicit) ? explicit : `https://${explicit}`;
    return withScheme.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_ORIGIN;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host.replace(/\/+$/, "")}`;
  }

  return "http://localhost:3001";
}

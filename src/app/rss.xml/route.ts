import { getEntries } from "@/xiv/content";
import { getSiteUrl } from "@/lib/siteUrl";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const siteUrl = getSiteUrl();
  const items = getEntries("en")
    .map((entry) => {
      const url = `${siteUrl}/log/${entry.slug}`;
      const pubDate = new Date(entry.publishedTime ?? entry.date).toUTCString();

      return `
        <item>
          <title>${escapeXml(entry.title)}</title>
          <link>${url}</link>
          <guid>${url}</guid>
          <pubDate>${pubDate}</pubDate>
          <description>${escapeXml(entry.summary)}</description>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>XIV Public Log</title>
        <link>${siteUrl}/log</link>
        <description>Public notes for XIV, MaloSound, and Green Machine.</description>
        <language>en-us</language>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

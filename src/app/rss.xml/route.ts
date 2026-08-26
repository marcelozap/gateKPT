import { getEntries } from "@/gatekpt/content";
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
      const url = `${siteUrl}/notes/${entry.slug}`;
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
        <title>GateKPT Notes</title>
        <link>${siteUrl}/notes</link>
        <description>Public GateKPT notes on AI systems, music, attention, and signal-mapped work.</description>
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

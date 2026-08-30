import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://oddversity.com';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Hand-rolled so the feed carries guides and posts in one stream without
// adding a dependency. Sorted newest first, capped at 50 items.
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog')).map((p) => ({
    title: p.data.title,
    description: p.data.description,
    url: `${SITE}/blog/${p.id}`,
    date: p.data.updated ?? p.data.published,
    category: 'Blog',
  }));
  const guides = (await getCollection('guides')).map((g) => ({
    title: g.data.title,
    description: g.data.description,
    url: `${SITE}/guides/${g.id}`,
    date: g.data.updated ?? g.data.published,
    category: 'Guide',
  }));

  const items = [...posts, ...guides]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 50);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Oddversity — guides and notes on building with AI</title>
    <link>${SITE}</link>
    <description>New guides and articles from Oddversity, a free hands-on curriculum for the agentic-AI era.</description>
    <language>en</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (item) => `    <item>
      <title>${escape(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <description>${escape(item.description)}</description>
      <category>${item.category}</category>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

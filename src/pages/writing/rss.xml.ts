import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublished } from '../../lib/collections';
import { SITE } from '../../lib/site';

/** RSS feed for the blog (`/writing/rss.xml`). Built from the same helper as the pages, so drafts never leak. */
export async function GET(context: APIContext) {
  const posts = await getPublished('writing');
  return rss({
    title: `${SITE.name} — Writing`,
    description: SITE.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writing/${post.id}`,
      categories: post.data.tags,
    })),
    customData: '<language>en</language>',
  });
}

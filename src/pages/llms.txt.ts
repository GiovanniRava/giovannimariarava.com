import type { APIContext } from 'astro';
import { getPublished } from '../lib/collections';
import { SITE } from '../lib/site';

/**
 * llms.txt (https://llmstxt.org): a Markdown index of the site for LLM agents,
 * generated at build time from the collections (drafts excluded).
 */
export async function GET(context: APIContext) {
  const origin = context.site!.origin;
  const section = async (name: 'research' | 'projects' | 'writing', heading: string) => {
    const entries = await getPublished(name);
    const lines = entries.map(
      (e) => `- [${e.data.title}](${origin}/${name}/${e.id}): ${e.data.description}`,
    );
    return [`## ${heading}`, '', ...(lines.length ? lines : ['- (none yet)']), ''];
  };

  const body = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `Personal website. Language: English. Canonical origin: ${origin}.`,
    '',
    ...(await section('research', 'Research')),
    ...(await section('projects', 'Projects')),
    ...(await section('writing', 'Writing')),
    '## Other',
    '',
    `- [About](${origin}/about)`,
    `- [CV](${origin}/cv)`,
    `- [Privacy](${origin}/privacy)`,
    `- [RSS feed](${origin}/writing/rss.xml)`,
    `- [Sitemap](${origin}/sitemap-index.xml)`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

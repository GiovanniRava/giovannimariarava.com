import { getCollection, type CollectionEntry } from 'astro:content';

export type CollectionName = 'research' | 'projects' | 'writing';

/**
 * Returns the published entries of a collection, newest first.
 *
 * Drafts (`draft: true`) are included only in development, so they can be
 * previewed locally, and are excluded from production builds. ALWAYS use this
 * helper instead of calling `getCollection` directly, otherwise a draft could
 * leak into pages, the sitemap, RSS or llms.txt.
 */
export async function getPublished<C extends CollectionName>(
  name: C,
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(name, ({ data }) => !import.meta.env.PROD || !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Date helpers: dates are always rendered explicitly, in ISO and human form. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export const humanDate = (d: Date) =>
  d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

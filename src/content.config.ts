import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Fields shared by every collection (research, projects, writing).
 * Keeping ONE schema means a Markdown file's front matter stays portable:
 * if the framework changes one day, these are plain, framework-neutral keys.
 *
 * Documented in docs/content-model.md — keep the two in sync.
 */
const baseSchema = z.object({
  /** Page title, also used for <title>, Open Graph and feeds. */
  title: z.string().min(1),
  /** One-sentence summary: meta description, list pages, RSS, llms.txt. Max ~160 chars. */
  description: z.string().min(1).max(200),
  /** Publication date (ISO `YYYY-MM-DD` in front matter). */
  date: z.coerce.date(),
  /** Optional last-update date, shown as "Updated" and used for sitemap/JSON-LD `dateModified`. */
  updated: z.coerce.date().optional(),
  /** Free-form lowercase keywords. */
  tags: z.array(z.string()).default([]),
  /** Optional external links. */
  // `preprocess` turns an empty `links:` key (YAML null, e.g. when all children are commented out) into {}.
  links: z.preprocess(
    (v) => v ?? {},
    z.object({
      repo: z.url().optional(),
      pdf: z.string().optional(), // URL or site-relative path such as /papers/foo.pdf
      demo: z.url().optional(),
    }),
  ),
  /** Drafts are visible in `astro dev` but excluded from production builds (see src/lib/collections.ts). */
  draft: z.boolean().default(false),
});

const loaderFor = (dir: string) => glob({ pattern: '**/*.{md,mdx}', base: `./src/content/${dir}` });

export const collections = {
  research: defineCollection({
    loader: loaderFor('research'),
    schema: baseSchema.extend({
      /** Where it appeared, e.g. "Master's thesis, University of Bologna". TODO per entry. */
      venue: z.string().optional(),
      /** Author names, in order. Defaults to the site owner (see src/lib/site.ts). */
      authors: z.array(z.string()).optional(),
    }),
  }),
  projects: defineCollection({
    loader: loaderFor('projects'),
    schema: baseSchema,
  }),
  writing: defineCollection({
    loader: loaderFor('writing'),
    schema: baseSchema,
  }),
};

import { appendFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Shapes `dist/` for the environment being built. Documented in docs/environments.md.
 *
 *  - mode 'launch': keep ONLY the files in LAUNCH_ALLOW. Everything else (other pages, feeds,
 *    llms.txt, cv.pdf ...) is removed from the output. It is an allow-list on purpose: a page
 *    added later stays out of production until it is listed here or the mode becomes 'full'.
 *  - target 'staging': the test site must never be indexed. Replace robots.txt with a blanket
 *    Disallow and add `X-Robots-Tag: noindex` to every response (belt and braces).
 */
const LAUNCH_ALLOW = new Set([
  '_astro',
  '_headers',
  '.well-known',
  '404.html',
  'favicon.svg',
  'index.html',
  'og-default.png',
  'robots.txt',
  'sitemap-0.xml',
  'sitemap-index.xml',
]);

export default function deployTarget({ mode, target }) {
  return {
    name: 'deploy-target',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);

        if (mode === 'launch') {
          const removed = [];
          for (const name of await readdir(out)) {
            if (LAUNCH_ALLOW.has(name)) continue;
            await rm(join(out, name), { recursive: true, force: true });
            removed.push(name);
          }
          logger.info(`launch mode: removed from dist: ${removed.join(', ') || '(nothing)'}`);
        }

        if (target === 'staging') {
          await writeFile(
            join(out, 'robots.txt'),
            '# Test environment: not for indexing.\nUser-agent: *\nDisallow: /\n',
          );
          await appendFile(join(out, '_headers'), '\n/*\n  X-Robots-Tag: noindex, nofollow\n');
          logger.info('staging target: robots.txt = Disallow all, X-Robots-Tag: noindex added');
        }
      },
    },
  };
}

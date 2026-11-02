// Fails when the built site (default: dist/) still contains placeholder text or placeholder pages:
//  - the markers TODO, FIXME and "lorem ipsum" in any text-like output file (HTML, XML, TXT, SVG,
//    JSON, webmanifest, CSS, and uncompressed PDF text);
//  - pages whose file name contains "example-" (the sample entries shipped with the scaffold).
// Used as a release gate: CI runs it for the full PRODUCTION build only (see docs/environments.md),
// so the test site may keep placeholders but they cannot reach the live full site.
// Zero dependencies: plain Node. Run with `npm run check:placeholders [dir]` after `npm run build`.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.argv[2] ?? 'dist';
const TEXT_EXT = new Set([
  '.html',
  '.xml',
  '.txt',
  '.svg',
  '.json',
  '.webmanifest',
  '.css',
  '.pdf',
]);
const MARKER = /TODO|FIXME|lorem ipsum/i;
const MAX_REPORTED = 50;
const CONTEXT = 50; // characters shown on each side of a match (built HTML is a single line)

if (!existsSync(root)) {
  console.error(`placeholder check: "${root}" does not exist. Run \`npm run build\` first.`);
  process.exit(2);
}

const findings = [];
const add = (file, detail) => findings.push(`${file}: ${detail}`);

for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const path = join(entry.parentPath, entry.name);
  const file = relative(root, path);

  if (/(^|[\\/])[^\\/]*example-/i.test(file))
    add(file, 'sample page from the scaffold (example-*)');
  if (!TEXT_EXT.has(extname(entry.name).toLowerCase())) continue;

  // latin1 keeps every byte intact, so a PDF is scanned without decoding errors.
  const text = readFileSync(path, extname(entry.name).toLowerCase() === '.pdf' ? 'latin1' : 'utf8');
  const found = text.match(MARKER);
  if (found) {
    const at = found.index ?? 0;
    const around = text
      .slice(Math.max(0, at - CONTEXT), at + found[0].length + CONTEXT)
      .replace(/\s+/g, ' ')
      .trim();
    const count = text.match(new RegExp(MARKER, 'gi'))?.length ?? 1;
    add(file, `${count} placeholder marker${count > 1 ? 's' : ''}, first: "…${around}…"`);
  }
}

if (findings.length) {
  const shown = findings.slice(0, MAX_REPORTED);
  console.error(
    `placeholder check failed: ${findings.length} file(s) in ${root}/ still contain placeholders:\n - ` +
      shown.join('\n - ') +
      (findings.length > shown.length ? `\n … and ${findings.length - shown.length} more` : '') +
      '\nResolve them (docs/go-live-checklist.md) or keep `site_mode: launch` in ci-cd.yml.',
  );
  process.exit(1);
}
console.log(`placeholder check OK (${root}/)`);

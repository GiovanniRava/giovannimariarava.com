// Fails when public/.well-known/security.txt is missing required RFC 9116 fields,
// or when `Expires` is in the past / less than 30 days away (renewal reminder).
// Zero dependencies: plain Node. Run with `npm run check:security-txt`.
import { readFileSync } from 'node:fs';

const FILE = new URL('../public/.well-known/security.txt', import.meta.url);
const WARN_DAYS = 30;

const text = readFileSync(FILE, 'utf8');
const field = (name) =>
  text
    .split('\n')
    .filter((l) => !l.startsWith('#'))
    .map((l) => l.match(new RegExp(`^${name}:\\s*(.+)$`, 'i'))?.[1]?.trim())
    .filter(Boolean);

const errors = [];
if (field('Contact').length === 0) errors.push('missing required field: Contact');
const [expires] = field('Expires');
if (!expires) {
  errors.push('missing required field: Expires');
} else {
  const date = new Date(expires);
  const days = (date.getTime() - Date.now()) / 86_400_000;
  if (Number.isNaN(days)) errors.push(`Expires is not a valid date: ${expires}`);
  else if (days < WARN_DAYS)
    errors.push(`Expires (${expires}) is ${Math.floor(days)} days away: renew it`);
  else if (days > 366)
    errors.push(`Expires (${expires}) is more than 1 year ahead (RFC 9116 recommends < 1 year)`);
}

if (errors.length) {
  console.error('security.txt check failed:\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log('security.txt OK');

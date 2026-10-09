/**
 * Site-wide constants. Single source of truth for identity data used by the
 * layout, the SEO component, JSON-LD, RSS and llms.txt.
 *
 * Everything marked TODO is a placeholder to be replaced by the site owner —
 * no biographical facts are invented here.
 */
export const SITE = {
  name: 'Giovanni Maria Rava',
  title: 'Giovanni Maria Rava',
  /** Used as default <meta description>. TODO(giovanni): refine wording. */
  description:
    'Personal website of Giovanni Maria Rava — research on backdoor attacks in LLM-based code review.',
  url: 'https://giovannimariarava.com',
  locale: 'en',
  /** TODO(giovanni): confirm the exact university / programme wording. */
  university: 'University of Bologna',
  /** Default social preview image (1200×630). TODO(giovanni): replace the solid-colour placeholder public/og-default.png with a real design. */
  defaultOgImage: '/og-default.png',
  /** Profiles for JSON-LD `sameAs`. TODO(giovanni): replace with real URLs. */
  sameAs: [
    'https://www.linkedin.com/in/TODO-linkedin-handle',
    'https://github.com/TODO-github-handle',
  ],
  /** Public contact address (Cloudflare Email Routing). TODO(giovanni): confirm alias. */
  email: 'hello@giovannimariarava.com',
} as const;

export const NAV = [
  { href: '/research', label: 'Research' },
  { href: '/projects', label: 'Projects' },
  { href: '/writing', label: 'Writing' },
  { href: '/about', label: 'About' },
  { href: '/cv', label: 'CV' },
] as const;

/**
 * Normalises `Astro.url.pathname` to the public URL path.
 * With `build.format: 'file'`, Astro reports "/about.html" at build time but "/about" in dev;
 * the public URL (what visitors and crawlers use) never has ".html". Used for canonical URLs
 * and for the "current page" state in the navigation.
 */
export function publicPath(pathname: string): string {
  const p = pathname.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
  return p.length > 1 ? p.replace(/\/$/, '') : '/';
}

/** English lives at the root ("/", "/projects/x"); Arabic under "/ar" ("/ar", "/ar/projects/x"). */
export const LANGS = ['en', 'ar'];
const AR_PREFIX = '/ar';

/**
 * Split an address path into its language and the path without the language prefix.
 * @param {string} pathname e.g. "/ar/projects/x"
 * @returns {{ lang: 'en' | 'ar', path: string }} e.g. { lang: 'ar', path: '/projects/x' }
 */
export function parseLocalePath(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === AR_PREFIX || clean.startsWith(`${AR_PREFIX}/`)) {
    return { lang: 'ar', path: clean.slice(AR_PREFIX.length) || '/' };
  }
  return { lang: 'en', path: clean };
}

/**
 * The address of a page in a language.
 * @param {string} path language-free path, optionally with a hash: "/", "/#about", "/projects/x"
 * @param {'en' | 'ar'} lang
 * @returns {string} e.g. "/ar#about", "/ar/projects/x"
 */
export function localePath(path, lang) {
  if (lang !== 'ar') return path;
  if (path === '/') return AR_PREFIX;
  if (path.startsWith('/#')) return `${AR_PREFIX}${path.slice(1)}`;
  return `${AR_PREFIX}${path}`;
}

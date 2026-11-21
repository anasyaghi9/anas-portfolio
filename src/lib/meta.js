import { content } from './content.js';
import { strings } from './i18n.js';
import { LANGS, localePath, parseLocalePath } from './locale.js';
import { plainText } from './utils.js';

/** A malformed address such as /projects/%E0 is just an unknown page (404), not a crash. */
function decodeSlug(slug) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return null;
  }
}

const PROJECT_PATH = /^\/projects\/([^/]+)$/;

/**
 * Everything a page needs in its <head>, worked out from its address alone, so the browser
 * and the build-time prerender produce the same title and tags.
 * @param {string} pathname
 */
export function pageMeta(pathname) {
  const { lang, path } = parseLocalePath(pathname);
  const data = content[lang];
  const t = strings[lang];
  const { site } = data;
  const base = {
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    siteName: site.name,
    alternates: null,
    image: site.photo,
    imageIsWide: false,
    type: 'website',
    status: 200,
  };

  if (path === '/') {
    return {
      ...base,
      title: site.pageTitle || site.name,
      description: site.pageDescription,
      alternates: Object.fromEntries(LANGS.map((l) => [l, localePath('/', l)])),
      person: true,
    };
  }

  const slug = PROJECT_PATH.exec(path)?.[1];
  const name = slug && decodeSlug(slug);
  const project = name && data.projects.items.find((p) => p.slug === name);
  if (project) {
    return {
      ...base,
      title: `${project.title} — ${site.name}`,
      description: plainText(project.summary),
      alternates: Object.fromEntries(LANGS.map((l) => [l, localePath(path, l)])),
      image: project.image || site.photo,
      imageIsWide: Boolean(project.image),
      type: 'article',
    };
  }

  const title = slug ? t.common.notFoundTitle : t.common.pageNotFoundTitle;
  return { ...base, title: `${title} — ${site.name}`, description: '', status: 404 };
}

/** Every address that exists, for prerendering and the sitemap. */
export function sitePaths() {
  const paths = ['/', ...content.en.projects.items.map((p) => `/projects/${p.slug}`)];
  return LANGS.flatMap((lang) => paths.map((p) => localePath(p, lang)));
}

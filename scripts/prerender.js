// Last step of `npm run build`. Renders every page to static HTML with its own title, description,
// share tags and language, so search engines and link previews see real content without
// JavaScript. Also writes 404.html, sitemap.xml, robots.txt and _headers.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SSR_DIR = path.join(ROOT, 'dist-ssr');

const { render, pageMeta, sitePaths, content } = await import(
  pathToFileURL(path.join(SSR_DIR, 'entry-server.js')).href
);

const siteUrl = (process.env.SITE_URL || content.en.site.siteUrl || '').replace(/\/+$/, '');
if (siteUrl && !/^https?:\/\/[^/\s]+/.test(siteUrl)) {
  throw new Error(`prerender: site URL must start with https:// (got "${siteUrl}")`);
}
const OG_LOCALE = { en: 'en_US', ar: 'ar_AR' };

const escapeHtml = (text) =>
  String(text ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const absolute = (p) => (siteUrl && p ? `${siteUrl}${encodeURI(p)}` : '');
const tag = (name, attrs) =>
  `<${name} ${Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
    .join(' ')} />`;

/** Output file for an address: "/" -> index.html, "/ar/projects/x" -> ar/projects/x.html. */
const fileFor = (pathname) => (pathname === '/' ? 'index.html' : `${pathname.slice(1)}.html`);

function personSchema(lang) {
  const { site, hero, education } = content[lang];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.title,
    url: absolute(lang === 'ar' ? '/ar' : '/') || undefined,
    image: absolute(site.photo) || undefined,
    sameAs: [site.github, site.linkedin].filter(Boolean),
    knowsAbout: hero.tags,
    alumniOf: education.items.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.institution })),
  };
  // "<" is escaped so the text can never close the <script> element.
  return `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`;
}

function headTags(meta, pathname) {
  const url = meta.status === 200 ? absolute(pathname) : '';
  const image = absolute(meta.image);
  const tags = [];
  if (url) tags.push(tag('link', { rel: 'canonical', href: url }));
  if (siteUrl && meta.alternates) {
    for (const [lang, href] of Object.entries(meta.alternates)) {
      tags.push(tag('link', { rel: 'alternate', hreflang: lang, href: absolute(href) }));
    }
    tags.push(tag('link', { rel: 'alternate', hreflang: 'x-default', href: absolute(meta.alternates.en) }));
  }
  if (meta.status !== 200) tags.push(tag('meta', { name: 'robots', content: 'noindex' }));

  tags.push(
    tag('meta', { property: 'og:type', content: meta.type }),
    tag('meta', { property: 'og:site_name', content: meta.siteName }),
    tag('meta', { property: 'og:title', content: meta.title }),
    tag('meta', { property: 'og:description', content: meta.description }),
    tag('meta', { property: 'og:locale', content: OG_LOCALE[meta.lang] }),
    tag('meta', { property: 'og:locale:alternate', content: OG_LOCALE[meta.lang === 'ar' ? 'en' : 'ar'] }),
    tag('meta', { name: 'twitter:card', content: meta.imageIsWide ? 'summary_large_image' : 'summary' }),
    tag('meta', { name: 'twitter:title', content: meta.title }),
    tag('meta', { name: 'twitter:description', content: meta.description }),
  );
  if (url) tags.push(tag('meta', { property: 'og:url', content: url }));
  if (image) {
    tags.push(
      tag('meta', { property: 'og:image', content: image }),
      tag('meta', { name: 'twitter:image', content: image }),
    );
  }
  if (meta.person) tags.push(personSchema(meta.lang));
  return tags.map((t) => `    ${t}`).join('\n');
}

function replaceOnce(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`prerender: ${what} not found in dist/index.html`);
  // A function, so a "$" in the content is never read as a replacement pattern like "$&".
  return html.replace(pattern, () => replacement);
}

function fillTemplate(template, pathname, { hydrate }) {
  const meta = pageMeta(pathname);
  let html = template;
  html = replaceOnce(html, /<html[^>]*>/, `<html lang="${meta.lang}" dir="${meta.dir}">`, '<html>');
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`, '<title>');
  html = replaceOnce(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    tag('meta', { name: 'description', content: meta.description }),
    'description meta',
  );
  html = replaceOnce(html, /<\/head>/, `${headTags(meta, pathname)}\n  </head>`, '</head>');
  html = replaceOnce(
    html,
    /<div id="root"><\/div>/,
    `<div id="root" data-prerendered="${hydrate ? escapeHtml(pathname) : ''}">${render(pathname)}</div>`,
    'root element',
  );
  return html;
}

/** Security headers for Cloudflare Pages and Netlify, allowing only this page's own inline script. */
function headersFile(template) {
  const inline = [...template.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
    (m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`,
  );
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${inline.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    // The contact form may post to any HTTPS form service set in content/en.md.
    "connect-src 'self' https:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
  return `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/images/generated/*
  Cache-Control: public, max-age=604800
`;
}

function sitemap(paths) {
  const urls = paths.map((p) => {
    const alternates = pageMeta(p).alternates ?? {};
    const links = Object.entries(alternates)
      .map(([lang, href]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeHtml(absolute(href))}" />`)
      .join('\n');
    return `  <url>\n    <loc>${escapeHtml(absolute(p))}</loc>\n${links}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

async function write(file, text) {
  const target = path.join(DIST, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, text);
}

async function main() {
  if (content.warnings.length > 0) {
    throw new Error(`content has ${content.warnings.length} problem(s); run npm run check`);
  }
  const template = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const paths = sitePaths();

  for (const pathname of paths) await write(fileFor(pathname), fillTemplate(template, pathname, { hydrate: true }));
  // Served for unknown addresses, so the browser renders it fresh rather than hydrating.
  // Cloudflare Pages uses the closest 404.html, so unknown /ar/... addresses get the Arabic one.
  await write('404.html', fillTemplate(template, '/404', { hydrate: false }));
  await write('ar/404.html', fillTemplate(template, '/ar/404', { hydrate: false }));
  await write('_headers', headersFile(template));

  const robots = ['User-agent: *', 'Allow: /'];
  if (siteUrl) {
    await write('sitemap.xml', sitemap(paths));
    robots.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
  }
  await write('robots.txt', `${robots.join('\n')}\n`);
  await rm(SSR_DIR, { recursive: true, force: true });

  console.log(`prerender: ${paths.length} pages + 404.html (English and Arabic)`);
  if (!siteUrl) {
    console.warn(
      'prerender: no "- Site URL:" in content/en.md (or SITE_URL), so canonical links, share images and sitemap.xml were skipped.',
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

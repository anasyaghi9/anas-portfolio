import { Marked } from 'marked';

/** Join class names, skipping falsy values. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/** Two-digit index: 1 -> "01". */
export function pad(n) {
  return String(n).padStart(2, '0');
}

// Fixed names rather than Intl: Node and browsers ship different month abbreviations ("Sep" vs
// "Sept"), and the prerendered page must match what the browser renders.
const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

/**
 * Format "2022-09" or "2022-09-01" as "Sep 2022"; any other text is returned unchanged.
 * @param {string} value @param {'en'|'ar'} lang
 */
export function formatMonth(value, lang = 'en') {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})(-\d{2})?$/.exec(value);
  const month = match && MONTHS[lang === 'ar' ? 'ar' : 'en'][Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : value;
}

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

// http(s), mailto, tel, site-relative ("/x" but not protocol-relative "//x") and "#anchor" links.
const SAFE_URL = /^(https?:|mailto:|tel:|\/(?!\/)|#)/i;

/**
 * Inline Markdown (bold, italic, code, links) for content paragraphs.
 * Raw HTML is escaped, images are shown as their alt text, and only safe links are kept.
 */
const inline = new Marked({
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    image({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      if (!SAFE_URL.test(href)) return label;
      const external = /^https?:/i.test(href);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const target = external ? ' target="_blank" rel="noreferrer"' : '';
      return `<a href="${escapeHtml(href)}"${titleAttr}${target} class="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground">${label}</a>`;
    },
  },
});

/** @param {string} text @returns {{ __html: string }} */
export function inlineMarkdown(text) {
  return { __html: inline.parseInline(text || '') };
}

/** Inline Markdown reduced to plain text, for page titles and meta descriptions. */
export function plainText(text) {
  return (text || '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|`)(.+?)\1/g, '$2')
    .replace(/<[^>]+>/g, '')
    .trim();
}

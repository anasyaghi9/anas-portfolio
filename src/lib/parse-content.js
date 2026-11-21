/**
 * Turns content/en.md and content/ar.md into the data the site renders.
 *
 * The Markdown layout (documented at the top of content/en.md and in README.md):
 *   # Section        one of SECTION_KEYS
 *   ## Item          a project, service, skill group, school or certificate
 *   ### Part         a case-study part inside a project
 *   - Field: value   a field on the closest section or item
 *   plain text       paragraphs (blank line between paragraphs)
 *
 * Runs in the browser and in Node (tests, `npm run check`), so it must not touch the DOM.
 */

export const SECTION_KEYS = [
  'site',
  'hero',
  'about',
  'projects',
  'services',
  'skills',
  'education',
  'certifications',
  'contact',
];

/** Case-study parts the UI has translated labels for, in display order. */
export const KNOWN_PARTS = ['overview', 'problem', 'solution', 'role', 'challenges', 'results'];
/** Part headings that map to a known part, in English or Arabic. */
const PART_ALIASES = {
  'my role': 'role',
  'نظرة عامة': 'overview',
  'المشكلة': 'problem',
  'الحل': 'solution',
  'دوري': 'role',
  'التحديات': 'challenges',
  'النتائج': 'results',
};

const FIELD_LINE = /^[-*]\s+([A-Za-z][A-Za-z ]*?)\s*:\s?(.*)$/;
const LIST_LINE = /^([-*+]|\d+[.)])\s+/;
// A closing run of "#" is only stripped when a space precedes it, so "## C#" keeps its "#".
const HEADING = /^(#{1,3})\s+(.+?)(?:\s+#+)?\s*$/;

/** @param {string} label @returns {string} "Live demo" -> "live_demo" */
export function toKey(label) {
  return label.trim().toLowerCase().replace(/\s+/g, '_');
}

/** @param {string} title @returns {string} */
function partKey(title) {
  const lower = title.trim().toLowerCase();
  return PART_ALIASES[lower] ?? toKey(lower);
}

/** @param {string} value @returns {string[]} */
export function splitList(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** @param {string} text @returns {string} */
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

const emptyBlock = () => ({ fields: {}, paragraphs: [] });

/**
 * Parse one Markdown file into a raw tree: { [section]: { fields, paragraphs, items } }.
 * @param {string} markdown
 * @param {string} fileLabel used in warnings, e.g. "en.md"
 * @returns {{ tree: Record<string, any>, warnings: string[] }}
 */
export function parseMarkdown(markdown, fileLabel = 'content') {
  const warnings = [];
  const tree = {};
  // Blank out comments but keep their line breaks, so warnings point at the right line.
  const lines = markdown
    .replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ''))
    .split(/\r?\n/);

  let section = null;
  let item = null;
  let part = null;
  let paragraph = [];
  let lastField = null; // { block, key } of the field on the previous line, for wrapped values

  const target = () => part ?? item ?? section;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(' ').trim();
    paragraph = [];
    const block = target();
    if (text && block) block.paragraphs.push(text);
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    const where = `${fileLabel}:${index + 1}`;
    const previousField = lastField;
    lastField = null;

    if (line === '') {
      flushParagraph();
      return;
    }

    // An indented line right after a field continues that field's value.
    if (previousField && /^\s/.test(rawLine) && !LIST_LINE.test(line)) {
      const { block, key } = previousField;
      block.fields[key] = `${block.fields[key]} ${line}`.trim();
      lastField = previousField;
      return;
    }

    const heading = line.match(HEADING);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const title = heading[2];

      if (level === 1) {
        const key = toKey(title);
        if (!SECTION_KEYS.includes(key)) {
          warnings.push(`${where}: unknown section "# ${title}" (expected one of: ${SECTION_KEYS.join(', ')}). It is ignored.`);
          section = null;
        } else {
          if (tree[key]) warnings.push(`${where}: section "# ${title}" appears twice; the parts are combined.`);
          tree[key] = tree[key] ?? { ...emptyBlock(), items: [] };
          section = tree[key];
        }
        item = null;
        part = null;
        return;
      }

      if (!section) {
        warnings.push(`${where}: "${line}" is outside a known "# Section" and is ignored.`);
        return;
      }

      if (level === 2) {
        item = { title, ...emptyBlock(), parts: [] };
        section.items.push(item);
        part = null;
        return;
      }

      if (!item) {
        warnings.push(`${where}: "### ${title}" must sit under a "## Item" heading. It is ignored.`);
        return;
      }
      part = { key: partKey(title), title, paragraphs: [] };
      item.parts.push(part);
      return;
    }

    const field = line.match(FIELD_LINE);
    if (field && !part && paragraph.length === 0) {
      const block = item ?? section;
      if (!block) {
        warnings.push(`${where}: field "${field[1]}" is outside a known section and is ignored.`);
        return;
      }
      const key = toKey(field[1]);
      block.fields[key] = field[2].trim();
      lastField = { block, key };
      return;
    }

    if (!target()) {
      warnings.push(`${where}: text outside a known section is ignored.`);
      return;
    }
    if (LIST_LINE.test(line)) {
      const reason = paragraph.length > 0 || part ? 'Lists are not supported in text' : 'Not a "- Field: value" line';
      warnings.push(`${where}: "${line.slice(0, 40)}" — ${reason}; it is shown as plain text.`);
    }
    paragraph.push(line);
  });

  flushParagraph();
  return { tree, warnings };
}

/** Prefer the translated value; fall back to the English one when it is missing or empty. */
const pick = (primary, fallback) => (primary !== undefined && primary !== '' ? primary : fallback);

function mergeFields(base = {}, override = {}) {
  const merged = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    merged[key] = pick(value, base[key]);
  });
  return merged;
}

function mergeParts(base = [], override = []) {
  const byKey = new Map(override.map((p) => [p.key, p]));
  const merged = base.map((p) => {
    const translated = byKey.get(p.key);
    return translated && translated.paragraphs.length > 0 ? { ...p, ...translated, title: translated.title } : p;
  });
  const baseKeys = new Set(base.map((p) => p.key));
  return [...merged, ...override.filter((p) => !baseKeys.has(p.key))];
}

function mergeItem(base, override) {
  if (!override) return base;
  return {
    title: pick(override.title, base.title),
    fields: mergeFields(base.fields, override.fields),
    paragraphs: override.paragraphs.length > 0 ? override.paragraphs : base.paragraphs,
    parts: mergeParts(base.parts, override.parts),
  };
}

function mergeItems(sectionKey, base = [], override = [], warnings = []) {
  if (sectionKey !== 'projects') {
    if (override.length > 0 && override.length !== base.length) {
      warnings.push(
        `ar.md: "# ${sectionKey}" has ${override.length} item(s) but en.md has ${base.length}. ` +
          'Items are matched in order, so translations may land on the wrong item.',
      );
    }
    return base.map((item, i) => mergeItem(item, override[i]));
  }

  const baseSlugs = base.map((item) => item.fields.slug || slugify(item.title));
  override.forEach((o) => {
    if (o.fields.slug && !baseSlugs.includes(o.fields.slug)) {
      warnings.push(`ar.md: project "${o.title}" has slug "${o.fields.slug}", which no project in en.md uses. It is ignored.`);
    }
  });
  const bySlug = new Map(override.filter((o) => o.fields.slug).map((o) => [o.fields.slug, o]));
  return base.map((item, i) => {
    const match = bySlug.get(baseSlugs[i]) ?? (override[i] && !override[i].fields.slug ? override[i] : undefined);
    return mergeItem(item, match);
  });
}

/**
 * Overlay a translation tree onto the English tree. Missing text falls back to English.
 * Items keep the English order and count; projects match on Slug, everything else on position.
 * Problems found while matching are appended to `warnings`.
 */
export function mergeTrees(base, override, warnings = []) {
  const merged = {};
  SECTION_KEYS.forEach((key) => {
    const b = base[key] ?? { ...emptyBlock(), items: [] };
    const o = override?.[key];
    merged[key] = o
      ? {
          fields: mergeFields(b.fields, o.fields),
          paragraphs: o.paragraphs.length > 0 ? o.paragraphs : b.paragraphs,
          items: mergeItems(key, b.items, o.items, warnings),
        }
      : b;
  });
  return merged;
}

const field = (block, key) => block?.fields?.[key] ?? '';

/**
 * Shape the merged tree into the view model the components use.
 * @param {Record<string, any>} tree
 */
export function toSiteModel(tree) {
  const s = (key) => tree[key] ?? { ...emptyBlock(), items: [] };
  const site = s('site');
  const hero = s('hero');
  const about = s('about');
  const projects = s('projects');
  const contact = s('contact');

  return {
    site: {
      name: field(site, 'name'),
      title: field(site, 'title'),
      initials: field(site, 'initials'),
      photo: field(site, 'photo'),
      email: field(site, 'email'),
      github: field(site, 'github'),
      linkedin: field(site, 'linkedin'),
      cv: field(site, 'cv'),
      focus: field(site, 'focus'),
      footerTagline: field(site, 'footer_tagline'),
      pageTitle: field(site, 'page_title'),
      pageDescription: field(site, 'page_description'),
      siteUrl: field(site, 'site_url').replace(/\/+$/, ''),
    },
    hero: {
      eyebrow: field(hero, 'eyebrow'),
      headline: field(hero, 'headline'),
      headlineMuted: field(hero, 'headline_muted'),
      tags: splitList(field(hero, 'tags')),
      summary: hero.paragraphs.join('\n\n'),
    },
    about: { heading: field(about, 'heading'), paragraphs: about.paragraphs },
    projects: {
      heading: field(projects, 'heading'),
      intro: field(projects, 'intro'),
      items: projects.items.map((p) => ({
        title: p.title,
        slug: field(p, 'slug') || slugify(p.title),
        image: field(p, 'image'),
        technologies: splitList(field(p, 'technologies')),
        github: field(p, 'github'),
        liveDemo: field(p, 'live_demo'),
        highlights: splitList(field(p, 'highlights')),
        diagram: field(p, 'diagram'),
        summary: p.paragraphs.join('\n\n'),
        parts: p.parts
          .filter((part) => part.paragraphs.length > 0)
          .map((part) => ({ key: part.key, title: part.title, body: part.paragraphs.join('\n\n') })),
      })),
    },
    services: {
      heading: field(s('services'), 'heading'),
      items: s('services').items.map((i) => ({ title: i.title, description: i.paragraphs.join('\n\n') })),
    },
    skills: {
      heading: field(s('skills'), 'heading'),
      items: s('skills').items.map((i) => ({
        name: i.title,
        items: splitList(field(i, 'items')),
        note: i.paragraphs.join('\n\n'),
      })),
    },
    education: {
      heading: field(s('education'), 'heading'),
      items: s('education').items.map((i) => ({
        institution: i.title,
        qualification: field(i, 'qualification'),
        field: field(i, 'field'),
        start: field(i, 'start'),
        end: field(i, 'end'),
        description: i.paragraphs.join('\n\n'),
      })),
    },
    certifications: {
      heading: field(s('certifications'), 'heading'),
      items: s('certifications').items.map((i) => ({
        title: i.title,
        issuer: field(i, 'issuer'),
        date: field(i, 'date'),
        link: field(i, 'link'),
        file: field(i, 'file'),
        description: i.paragraphs.join('\n\n'),
      })),
    },
    contact: {
      heading: field(contact, 'heading'),
      intro: field(contact, 'intro'),
      formEndpoint: field(contact, 'form_endpoint'),
    },
  };
}

const PLACEHOLDER_MARK = /<!--\s*placeholder\b[^>]*-->/i;
const DUMMY_VALUE = /example\.com|placeholder/i;

/**
 * Lists dummy values still in a content file: the field right after a "<!-- placeholder ... -->"
 * line, and any field whose value uses example.com or "placeholder".
 * @param {string} source
 * @param {string} fileLabel e.g. "en.md"
 * @returns {string[]} e.g. 'en.md:27 LinkedIn'
 */
export function findPlaceholders(source, fileLabel) {
  const found = [];
  let inComment = false;
  let marked = false;
  source.split('\n').forEach((line, i) => {
    if (inComment) {
      inComment = !line.includes('-->');
      return;
    }
    if (PLACEHOLDER_MARK.test(line)) {
      marked = true;
      return;
    }
    if (line.includes('<!--') && !line.includes('-->')) {
      inComment = true;
      return;
    }
    const field = /^- ([^:]+):\s*(.*)$/.exec(line);
    if (field && field[2] && (marked || DUMMY_VALUE.test(field[2]))) found.push(`${fileLabel}:${i + 1} ${field[1]}`);
    if (line.trim()) marked = false;
  });
  return found;
}

/** Checks that only make sense on the finished English model. */
function validateModel(model) {
  const warnings = [];
  if (!model.site.name) warnings.push('en.md: "# Site" needs a "- Name:" field.');
  if (model.site.siteUrl && !/^https?:\/\/[^/\s]+/.test(model.site.siteUrl)) {
    warnings.push(`en.md: "- Site URL:" must start with https:// (got "${model.site.siteUrl}").`);
  }
  const slugs = new Set();
  model.projects.items.forEach((p) => {
    if (slugs.has(p.slug)) warnings.push(`en.md: two projects share the slug "${p.slug}"; links to the second one will not work.`);
    slugs.add(p.slug);
  });
  return warnings;
}

/**
 * Build both language models from the two Markdown sources.
 * @param {string} enSource
 * @param {string} arSource
 * @returns {{ en: ReturnType<typeof toSiteModel>, ar: ReturnType<typeof toSiteModel>, warnings: string[] }}
 */
export function buildContent(enSource, arSource) {
  const en = parseMarkdown(enSource, 'en.md');
  const ar = parseMarkdown(arSource ?? '', 'ar.md');
  const mergeWarnings = [];
  const enModel = toSiteModel(mergeTrees(en.tree, {}));
  const arModel = toSiteModel(mergeTrees(en.tree, ar.tree, mergeWarnings));
  return {
    en: enModel,
    ar: arModel,
    warnings: [...en.warnings, ...ar.warnings, ...mergeWarnings, ...validateModel(enModel)],
  };
}

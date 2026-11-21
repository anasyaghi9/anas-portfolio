import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildContent, findPlaceholders, parseMarkdown } from './parse-content.js';
import { sendMessage, validateMessage } from './send-message.js';
import { inlineMarkdown, plainText } from './utils.js';

const read = (name) => readFileSync(new URL(`../../content/${name}`, import.meta.url), 'utf8');

describe('real content files', () => {
  const content = buildContent(read('en.md'), read('ar.md'));

  it('parse without warnings', () => {
    expect(content.warnings).toEqual([]);
  });

  it('match the live site in English', () => {
    const { site, projects, services, skills, education, certifications } = content.en;
    expect(site.name).toBe('Anas Atallah Yaghi');
    expect(projects.items.map((p) => p.slug)).toEqual([
      'event-ticketing-backend',
      'mealsrater-api',
      'mini-social-network',
      'little-lemon',
    ]);
    expect(projects.items[0].parts.map((p) => p.key)).toEqual(['problem', 'solution', 'role', 'challenges', 'results']);
    expect(projects.items[3].parts.map((p) => p.key)).toEqual(['problem', 'solution', 'role']);
    expect(services.items).toHaveLength(4);
    expect(skills.items.map((g) => g.items.length)).toEqual([2, 3, 3, 4, 6, 3]);
    expect(education.items[0]).toMatchObject({ start: '2022-09', end: '2026-08' });
    expect(certifications.items).toHaveLength(3);
  });

  it('uses Arabic text and falls back to English for the rest', () => {
    const { ar, en } = content;
    expect(ar.projects.items[0].title).toBe('باك إند لتذاكر الفعاليات');
    expect(ar.projects.items[0].image).toBe(en.projects.items[0].image);
    expect(ar.projects.items[0].technologies).toEqual(en.projects.items[0].technologies);
    expect(ar.skills.items[0]).toMatchObject({ name: 'اللغات', items: ['Python', 'SQL'] });
    expect(ar.site.name).toBe('أنس عطا الله ياغي');
    expect(ar.site.photo).toBe(en.site.photo);
    expect(ar.education.items[0].institution).toBe('جامعة الأزهر');
    expect(ar.hero.eyebrow).toBe('مطوّر باك إند');
  });
});

describe('parseMarkdown', () => {
  it('reads fields, paragraphs, items and parts', () => {
    const { tree, warnings } = parseMarkdown(
      ['# Projects', '- Heading: Work', '', '## Demo', '- Slug: demo', '', 'One', 'line.', '', '### Problem', '', 'Hard.'].join('\n'),
    );
    expect(warnings).toEqual([]);
    expect(tree.projects.fields.heading).toBe('Work');
    expect(tree.projects.items[0]).toMatchObject({
      title: 'Demo',
      fields: { slug: 'demo' },
      paragraphs: ['One line.'],
      parts: [{ key: 'problem', paragraphs: ['Hard.'] }],
    });
  });

  it('warns about unknown sections and stray parts', () => {
    const { warnings } = parseMarkdown('# Blog\n\ntext\n\n# Projects\n\n### Problem\n', 'x.md');
    expect(warnings[0]).toMatch(/x\.md:1: unknown section "# Blog"/);
    expect(warnings.some((w) => w.includes('must sit under a "## Item"'))).toBe(true);
  });

  it('ignores HTML comments', () => {
    const { tree } = parseMarkdown('<!--\n# Blog\n-->\n# Site\n- Name: A');
    expect(tree.site.fields.name).toBe('A');
  });

  it('keeps custom case-study parts and flags duplicate slugs', () => {
    const md = '# Site\n- Name: A\n# Projects\n## One\n- Slug: x\n### Lessons learned\n\nText\n## Two\n- Slug: x\n';
    const { en, warnings } = buildContent(md, '');
    expect(en.projects.items[0].parts[0]).toMatchObject({ key: 'lessons_learned', title: 'Lessons learned' });
    expect(warnings.some((w) => w.includes('share the slug "x"'))).toBe(true);
  });
  it('lists placeholder values but not the header comment', () => {
    const md = '<!--\n  e.g. https://example.com\n-->\n# Site\n<!-- placeholder: dummy -->\n- Email: a@b.co\n- Name: A\n- LinkedIn: https://x.example.com/in/a\n';
    expect(findPlaceholders(md, 'en.md')).toEqual(['en.md:6 Email', 'en.md:8 LinkedIn']);
  });

  it('requires an absolute Site URL', () => {
    const site = (url) => buildContent(`# Site\n- Name: A\n- Site URL: ${url}\n`, '');
    expect(site('anas.dev').warnings.some((w) => w.includes('Site URL'))).toBe(true);
    expect(site('https://anas.dev/')).toMatchObject({ warnings: [], en: { site: { siteUrl: 'https://anas.dev' } } });
  });
});

describe('parser edge cases (regressions from review)', () => {
  it('keeps a "#" that is part of a heading title', () => {
    const { tree } = parseMarkdown('# Skills\n## C#\n## F# ##\n');
    expect(tree.skills.items.map((i) => i.title)).toEqual(['C#', 'F#']);
  });

  it('joins an indented continuation line onto the field above', () => {
    const { tree, warnings } = parseMarkdown('# Projects\n## P\n- Technologies: A,\n  B, C\n\nSummary.');
    expect(warnings).toEqual([]);
    expect(tree.projects.items[0].fields.technologies).toBe('A, B, C');
    expect(tree.projects.items[0].paragraphs).toEqual(['Summary.']);
  });

  it('warns about list lines inside text', () => {
    const { warnings } = parseMarkdown('# Projects\n## P\n### Problem\n\n- first\n- second\n', 'x.md');
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch(/^x\.md:5: .*Lists are not supported/);
  });

  it('reports real line numbers after a multi-line comment', () => {
    const { warnings } = parseMarkdown('<!--\na\nb\n-->\n# Bogus\n', 'x.md');
    expect(warnings[0]).toMatch(/^x\.md:5: unknown section/);
  });

  it('accepts Arabic case-study headings without duplicating parts', () => {
    const en = '# Site\n- Name: A\n# Projects\n## P\n- Slug: p\n### Problem\n\nEN\n';
    const ar = '# Projects\n## ب\n- Slug: p\n### المشكلة\n\nAR\n';
    const { ar: model } = buildContent(en, ar);
    expect(model.projects.items[0].parts).toEqual([{ key: 'problem', title: 'المشكلة', body: 'AR' }]);
  });

  it('warns when Arabic items cannot be matched', () => {
    const en = '# Site\n- Name: A\n# Projects\n## P\n- Slug: p\n# Education\n## S1\n## S2\n';
    const ar = '# Projects\n## X\n- Slug: pp\n# Education\n## S2\n';
    const { warnings } = buildContent(en, ar);
    expect(warnings.some((w) => w.includes('slug "pp"'))).toBe(true);
    expect(warnings.some((w) => w.includes('"# education" has 1 item(s) but en.md has 2'))).toBe(true);
  });
});

describe('inlineMarkdown', () => {
  it('renders emphasis and safe links, escapes raw HTML and drops unsafe links', () => {
    expect(inlineMarkdown('**bold** [x](https://a.b)').__html).toContain('<strong>bold</strong>');
    expect(inlineMarkdown('[x](https://a.b)').__html).toContain('target="_blank"');
    expect(inlineMarkdown('<img src=x onerror=alert(1)>').__html).not.toContain('<img');
    expect(inlineMarkdown('[x](javascript:alert(1))').__html).not.toContain('href');
    expect(inlineMarkdown('[x](//evil.example)').__html).not.toContain('href');
    expect(inlineMarkdown('![alt](javascript:alert(1))').__html).toBe('alt');
  });

  it('plainText strips Markdown for meta tags', () => {
    expect(plainText('**Bold** and [a link](https://a.b) with `code`')).toBe('Bold and a link with code');
  });
});

describe('contact form', () => {
  const messages = { name: 'n', email: 'e', message: 'm', messageTooLong: 'long' };

  it('validates required fields, email shape and message length', () => {
    expect(validateMessage({ name: ' ', email: 'bad', message: '' }, messages)).toEqual({ name: 'n', email: 'e', message: 'm' });
    expect(validateMessage({ name: 'A', email: 'a@b.co', message: 'hi' }, messages)).toEqual({});
    expect(validateMessage({ name: 'A', email: 'a@b.co', message: 'x'.repeat(5001) }, messages)).toEqual({ message: 'long' });
  });

  const payload = { contact_type: 'job', name: 'A', email: 'a@b.co', company: '', role_title: '', message: 'hi' };

  it('posts to the endpoint when one is set', async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { ok: true, status: 200 };
    };
    await expect(sendMessage({ payload, endpoint: 'https://f.example/x', fetchImpl })).resolves.toEqual({ status: 'sent' });
    expect(calls[0]).toEqual({ url: 'https://f.example/x', body: payload });
  });

  it('reports a failed request instead of throwing', async () => {
    const fetchImpl = async () => {
      throw new Error('offline');
    };
    await expect(sendMessage({ payload, endpoint: 'https://f.example/x', fetchImpl })).resolves.toEqual({
      status: 'failed',
      error: 'offline',
    });
  });

  it('posts to the local inbox when no endpoint is set', async () => {
    const urls = [];
    const fetchImpl = async (url) => {
      urls.push(url);
      return { ok: false, status: 404 };
    };
    await expect(sendMessage({ payload, endpoint: '', fetchImpl })).resolves.toEqual({
      status: 'failed',
      error: 'Server answered 404',
    });
    expect(urls).toEqual(['/api/contact']);
  });
});

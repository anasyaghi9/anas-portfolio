import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createContactHandler, formatEntry, isInboxRequest, validateSubmission } from './contact-inbox.js';

const good = { contact_type: 'job', name: 'Sara', email: 'sara@example.com', company: 'Acme', role_title: '', message: 'Hello' };

describe('validateSubmission', () => {
  it('accepts a complete message and cleans single-line fields', () => {
    const result = validateSubmission({ ...good, name: '  Sara\n# Fake  ' });
    expect(result).toMatchObject({ ok: true, value: { name: 'Sara # Fake', contact_type: 'job' } });
  });

  it('rejects missing or malformed fields', () => {
    expect(validateSubmission(null).ok).toBe(false);
    expect(validateSubmission([good]).ok).toBe(false);
    expect(validateSubmission({ ...good, name: { toString: null } })).toEqual({ ok: false, error: 'Name must be text' });
    expect(validateSubmission({ ...good, message: ['hi'] })).toEqual({ ok: false, error: 'Message must be text' });
    expect(validateSubmission({ ...good, name: ' ' }).ok).toBe(false);
    expect(validateSubmission({ ...good, email: 'nope' }).ok).toBe(false);
    expect(validateSubmission({ ...good, message: 'x'.repeat(5001) }).ok).toBe(false);
    expect(validateSubmission({ ...good, email: `${'a'.repeat(210)}@example.com` })).toEqual({ ok: false, error: 'Email is too long' });
    expect(validateSubmission({ ...good, contact_type: 'spam' }).value.contact_type).toBe('general');
  });
});

describe('isInboxRequest', () => {
  it('catches every spelling of the inbox address', () => {
    for (const url of [
      '/messages/inbox.md',
      '/messages/inbox.md?import&raw??',
      '/%6Dessages/inbox.md',
      '/%256Dessages/inbox.md',
      '/@fs/Users/x/portfolio/messages/inbox.md?raw',
      '/Messages/inbox.md',
      '/./messages//inbox.md',
      '/%E0%A4%A',
    ]) {
      expect(isInboxRequest(url, 'messages'), url).toBe(true);
    }
  });

  it('leaves the rest of the site alone', () => {
    for (const url of ['/', '/ar', '/projects/mealsrater-api', '/src/messages.js', '/api/contact']) {
      expect(isInboxRequest(url, 'messages'), url).toBe(false);
    }
  });
});

describe('formatEntry', () => {
  it('quotes the message so it cannot fake a new entry', () => {
    const { value } = validateSubmission({ ...good, message: 'Hi\n\n## 2020 — Not real' });
    const entry = formatEntry(value, new Date('2026-11-21T10:00:00Z'));
    expect(entry).toBe(
      '## 2026-11-21T10:00:00.000Z — Sara\n\n- Type: job\n- Name: Sara\n- Email: sara@example.com\n- Company: Acme\n\n> Hi\n>\n> ## 2020 — Not real\n\n',
    );
  });
});

describe('POST /api/contact', () => {
  let dir;
  let server;
  let base;
  const file = () => path.join(dir, 'messages', 'inbox.md');

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'inbox-'));
    const handler = createContactHandler({ file: file(), now: () => new Date('2026-11-21T10:00:00Z') });
    server = createServer((req, res) => handler(req, res, () => res.writeHead(404).end()));
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });

  const post = (body, type = 'application/json') =>
    fetch(`${base}/api/contact`, { method: 'POST', headers: { 'Content-Type': type }, body });

  it('appends each message to the Markdown file', async () => {
    expect((await post(JSON.stringify(good))).status).toBe(201);
    expect((await post(JSON.stringify({ ...good, name: 'Omar' }))).status).toBe(201);
    const text = await readFile(file(), 'utf8');
    expect(text.match(/^## /gm)).toHaveLength(2);
    expect(text).toContain('— Omar');
  });

  it('accepts every field at its limit in a non-Latin script', async () => {
    const body = { ...good, name: '名'.repeat(120), company: '社'.repeat(160), role_title: '役'.repeat(160), message: '字'.repeat(5000) };
    expect(new TextEncoder().encode(JSON.stringify(body)).length).toBeGreaterThan(16 * 1024);
    expect((await post(JSON.stringify(body))).status).toBe(201);
  });

  it('refuses bad requests without writing', async () => {
    const before = await readFile(file(), 'utf8');
    expect((await post(JSON.stringify({ ...good, email: 'x' }))).status).toBe(400);
    expect((await post('{oops')).status).toBe(400);
    expect((await post('{"name":{"toString":null},"email":"a@b.co","message":"Hi"}')).status).toBe(400);
    expect((await post('name=x', 'application/x-www-form-urlencoded')).status).toBe(415);
    expect((await post(JSON.stringify({ ...good, message: 'x'.repeat(70000) }))).status).toBe(413);
    expect((await fetch(`${base}/api/contact`)).status).toBe(405);
    expect((await fetch(`${base}/other`)).status).toBe(404);
    expect(await readFile(file(), 'utf8')).toBe(before);
  });
});

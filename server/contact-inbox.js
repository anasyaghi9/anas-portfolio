// Saves contact-form messages to a Markdown file (messages/inbox.md by default).
// Runs inside `npm run dev` and `npm run preview` as a Vite plugin. A static host such as
// Cloudflare Pages has no writable disk, so a deployed site needs its own handler at the
// same address (POST /api/contact) before the form works there.
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { CONTACT_LIMITS } from '../src/lib/contact-limits.js';

export const CONTACT_PATH = '/api/contact';
// Room for every field at its limit in any script (up to 6 bytes per character once JSON-escaped).
const MAX_BODY_BYTES = 64 * 1024;
const TYPES = ['job', 'freelance', 'general'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LABELS = { name: 'Name', email: 'Email', company: 'Company', role_title: 'Role', message: 'Message' };

const TEXT_FIELDS = ['name', 'email', 'company', 'role_title', 'message'];

/** One line of text: no line breaks, trimmed. */
const oneLine = (value) => value.replace(/\s+/g, ' ').trim();

/**
 * Checks a submitted form on the server side too, since anyone can post to the address.
 * @param {unknown} body parsed JSON
 * @returns {{ ok: true, value: Record<string, string> } | { ok: false, error: string }}
 */
export function validateSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Expected a JSON object' };
  // Only plain strings (or nothing): converting an object could run its own code or throw.
  const notText = TEXT_FIELDS.find((key) => body[key] != null && typeof body[key] !== 'string');
  if (notText) return { ok: false, error: `${LABELS[notText]} must be text` };
  const text = (key) => body[key] ?? '';
  const value = {
    contact_type: TYPES.includes(body.contact_type) ? body.contact_type : 'general',
    name: oneLine(text('name')),
    email: oneLine(text('email')),
    company: oneLine(text('company')),
    role_title: oneLine(text('role_title')),
    message: text('message').replace(/\r\n?/g, '\n').trim(),
  };
  if (!value.name) return { ok: false, error: 'Name is required' };
  if (!EMAIL_PATTERN.test(value.email)) return { ok: false, error: 'A valid email is required' };
  if (!value.message) return { ok: false, error: 'Message is required' };
  // Too long is refused, never cut short: a shortened email address would look valid but bounce.
  const tooLong = Object.keys(CONTACT_LIMITS).find((key) => value[key].length > CONTACT_LIMITS[key]);
  if (tooLong) return { ok: false, error: `${LABELS[tooLong]} is too long` };
  return { ok: true, value };
}

/**
 * One message as Markdown. The message is quoted line by line, so text a visitor types can
 * never start a new heading and look like a separate message.
 * @param {Record<string, string>} value output of validateSubmission
 * @param {Date} date
 */
export function formatEntry(value, date) {
  const fields = [
    `- Type: ${value.contact_type}`,
    `- Name: ${value.name}`,
    `- Email: ${value.email}`,
    value.company ? `- Company: ${value.company}` : '',
    value.role_title ? `- Role: ${value.role_title}` : '',
  ].filter(Boolean);
  const quoted = value.message.split('\n').map((line) => (line ? `> ${line}` : '>'));
  return `## ${date.toISOString()} — ${value.name}\n\n${fields.join('\n')}\n\n${quoted.join('\n')}\n\n`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    // Past the limit, keep reading but drop the data, so the 413 answer can still be sent.
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size <= MAX_BODY_BYTES) chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > MAX_BODY_BYTES) reject(Object.assign(new Error('Message is too large'), { status: 413 }));
      else resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * Connect-style handler for POST /api/contact.
 * @param {{ file: string, now?: () => Date }} options
 */
export function createContactHandler({ file, now = () => new Date() }) {
  // Connect ignores rejected promises, and an unhandled one stops the whole dev server.
  return function safeHandleContact(req, res, next) {
    handleContact(req, res, next).catch((error) => {
      console.error(`[contact] unexpected error: ${error.message}`);
      if (!res.headersSent) reply(res, 500, { error: 'Unexpected error' });
    });
  };

  async function handleContact(req, res, next) {
    if (req.url?.split('?')[0] !== CONTACT_PATH) return next();
    if (req.method !== 'POST') return reply(res, 405, { error: 'Use POST' });
    // Browsers only send JSON cross-site after a preflight we never answer, so this also
    // keeps other sites from posting here.
    if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) {
      return reply(res, 415, { error: 'Send JSON' });
    }

    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch (error) {
      return reply(res, error.status ?? 400, { error: error.status ? error.message : 'Invalid JSON' });
    }

    const result = validateSubmission(body);
    if (!result.ok) return reply(res, 400, { error: result.error });

    try {
      await mkdir(path.dirname(file), { recursive: true });
      await appendFile(file, formatEntry(result.value, now()));
    } catch (error) {
      console.error(`[contact] could not save to ${file}: ${error.message}`);
      return reply(res, 500, { error: 'Could not save the message' });
    }
    return reply(res, 201, { ok: true });
  }
}

/**
 * True when a request address points into the inbox folder, in any spelling Vite accepts
 * (/messages/..., /@fs/<path>/messages/..., percent-encoded, with ?raw and similar suffixes).
 * @param {string} url
 * @param {string} folderName e.g. "messages"
 */
export function isInboxRequest(url, folderName) {
  let pathname = String(url ?? '').split('?')[0];
  try {
    // Decode repeatedly so double-encoded addresses are caught too.
    for (let i = 0; i < 3 && pathname.includes('%'); i += 1) pathname = decodeURIComponent(pathname);
  } catch {
    return true; // Malformed encoding: refuse rather than guess.
  }
  return pathname.replace(/\\/g, '/').toLowerCase().split('/').includes(folderName.toLowerCase());
}

/** Vite plugin: saves form posts and refuses to serve the inbox, for `vite dev` and `vite preview`. */
export function contactInbox({ file }) {
  const handler = createContactHandler({ file });
  const folderName = path.basename(path.dirname(file));
  // Runs before Vite's own file serving, so it does not depend on server.fs.deny alone.
  const guard = (req, res, next) => (isInboxRequest(req.url, folderName) ? reply(res, 403, { error: 'Forbidden' }) : next());
  return {
    name: 'contact-inbox',
    configureServer(server) {
      server.middlewares.use(guard);
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(guard);
      server.middlewares.use(handler);
    },
  };
}

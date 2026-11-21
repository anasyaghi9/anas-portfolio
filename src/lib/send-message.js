/**
 * Contact-form delivery. Messages go to POST /api/contact, which saves them to
 * messages/inbox.md while `npm run dev` or `npm run preview` runs (server/contact-inbox.js).
 * "- Form endpoint:" in content/en.md can point the form at another address instead.
 */

import { CONTACT_LIMITS } from './contact-limits.js';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DEFAULT_ENDPOINT = '/api/contact';
const REQUEST_TIMEOUT_MS = 15000;

/**
 * @param {{ name: string, email: string, message: string }} values
 * @param {{ name: string, email: string, message: string, messageTooLong: string }} messages error text
 * @returns {Record<string, string>} only the fields that failed
 */
export function validateMessage(values, messages) {
  const errors = {};
  if (!values.name.trim()) errors.name = messages.name;
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = messages.email;
  if (!values.message.trim()) errors.message = messages.message;
  else if (values.message.trim().length > CONTACT_LIMITS.message) errors.message = messages.messageTooLong;
  return errors;
}

/**
 * @param {{ payload: Record<string,string>, endpoint?: string, fetchImpl?: typeof fetch }} args
 * @returns {Promise<{ status: 'sent' } | { status: 'failed', error: string }>}
 */
export async function sendMessage({ payload, endpoint = DEFAULT_ENDPOINT, fetchImpl = globalThis.fetch }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetchImpl(endpoint || DEFAULT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.ok) return { status: 'sent' };
    return { status: 'failed', error: `Server answered ${res.status}` };
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : 'Network error' };
  } finally {
    clearTimeout(timer);
  }
}

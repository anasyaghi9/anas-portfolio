import { useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useSite } from '../lib/SiteContext.jsx';
import { CONTACT_LIMITS } from '../lib/contact-limits.js';
import { sendMessage, validateMessage } from '../lib/send-message.js';
import { cn } from '../lib/utils.js';
import { SectionHeading } from './ui.jsx';

const CONTACT_TYPES = ['job', 'freelance', 'general'];
// "hp_check" is the spam trap. Its name avoids words browsers autofill (website, url, phone...).
const EMPTY_FORM = { name: '', email: '', company: '', role_title: '', message: '', hp_check: '' };
const FIELD_ORDER = ['name', 'email', 'message'];
const INPUT =
  'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/60 focus:outline-hidden';

function Field({ id, label, error, children }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="label-mono block text-foreground/70">
        {label}
      </label>
      {children}
      <p id={`${id}-error`} role="alert" className={error ? 'text-xs text-destructive' : 'sr-only'}>
        {error ?? ''}
      </p>
    </div>
  );
}

export default function Contact() {
  const { t, data } = useSite();
  const { site, contact } = data;
  const [type, setType] = useState('job');
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | sent | error

  const update = (key) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((v) => ({ ...v, [key]: undefined }));
  };

  const errorProps = (key) =>
    errors[key] ? { 'aria-invalid': true, 'aria-describedby': `contact-${key}-error` } : {};

  async function onSubmit(e) {
    e.preventDefault();
    const found = validateMessage(values, t.contact.errors);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((key) => found[key]);
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }

    // Bots fill every field; people never see this one.
    if (values.hp_check) {
      setState('sent');
      return;
    }

    setState('sending');
    const result = await sendMessage({
      endpoint: contact.formEndpoint,
      payload: {
        contact_type: type,
        name: values.name.trim(),
        email: values.email.trim(),
        company: type === 'general' ? '' : values.company.trim(),
        role_title: type === 'job' ? values.role_title.trim() : '',
        message: values.message.trim(),
      },
    });

    if (result.status === 'sent') {
      setValues(EMPTY_FORM);
      setState('sent');
      return;
    }
    console.error('[contact] message not sent:', result.error);
    setState('error');
  }

  const links = [
    site.github ? { label: 'GitHub', href: site.github } : null,
    site.linkedin ? { label: 'LinkedIn', href: site.linkedin } : null,
  ].filter(Boolean);
  const done = state === 'sent';

  return (
    <section id="contact" className="section-shell">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            index="07"
            label={t.nav.contact}
            title={contact.heading || t.sections.contact.title}
            description={contact.intro}
          />
          <div className="mt-10 space-y-3">
            {site.email ? (
              <a href={`mailto:${site.email}`} className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                {site.email}
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ) : null}
            <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8">
          {/* Always mounted, so screen readers announce the result when its text changes. */}
          <p className="sr-only" role="status">
            {done ? t.contact.successTitle : ''}
          </p>
          <div className="rounded-2xl border border-border bg-card p-6 md:p-9">
            {done ? (
              <div className="flex flex-col items-start gap-4 py-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Check className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-medium tracking-tight text-foreground">
                    {t.contact.successTitle}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {t.contact.successBody}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setState('idle')}
                  className="mt-2 text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  {t.contact.another}
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="space-y-5">
                <Field id="contact-type" label={t.contact.typeLabel}>
                  <div className="relative">
                    <select
                      id="contact-type"
                      name="contact_type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className={cn(INPUT, 'appearance-none pe-10')}
                    >
                      {CONTACT_TYPES.map((key) => (
                        <option key={key} value={key}>
                          {t.contact.types[key]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute inset-e-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="contact-name" label={t.contact.fields.name} error={errors.name}>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={values.name}
                      maxLength={CONTACT_LIMITS.name}
                      onChange={update('name')}
                      placeholder={t.contact.placeholders.name}
                      className={INPUT}
                      {...errorProps('name')}
                    />
                  </Field>
                  <Field id="contact-email" label={t.contact.fields.email} error={errors.email}>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      dir="ltr"
                      value={values.email}
                      maxLength={CONTACT_LIMITS.email}
                      onChange={update('email')}
                      placeholder={t.contact.placeholders.email}
                      className={INPUT}
                      {...errorProps('email')}
                    />
                  </Field>
                </div>

                {type !== 'general' ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="contact-company" label={t.contact.fields.company}>
                      <input
                        id="contact-company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        value={values.company}
                        maxLength={CONTACT_LIMITS.company}
                        onChange={update('company')}
                        placeholder={t.contact.placeholders.company}
                        className={INPUT}
                      />
                    </Field>
                    {type === 'job' ? (
                      <Field id="contact-role" label={t.contact.fields.role}>
                        <input
                          id="contact-role"
                          name="role_title"
                          type="text"
                          value={values.role_title}
                          maxLength={CONTACT_LIMITS.role_title}
                          onChange={update('role_title')}
                          placeholder={t.contact.placeholders.role}
                          className={INPUT}
                        />
                      </Field>
                    ) : null}
                  </div>
                ) : null}

                <Field id="contact-message" label={t.contact.fields.message} error={errors.message}>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    value={values.message}
                    maxLength={CONTACT_LIMITS.message}
                    onChange={update('message')}
                    placeholder={t.contact.placeholders.message}
                    className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/60 focus:outline-hidden"
                    {...errorProps('message')}
                  />
                </Field>

                {/* Clipped in place rather than pushed off-screen: an offset would widen the page in RTL. */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="contact-hp-check">{t.contact.honeypot}</label>
                  <input
                    id="contact-hp-check"
                    name="hp_check"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.hp_check}
                    onChange={update('hp_check')}
                  />
                </div>

                {state === 'error' ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {t.contact.errorTitle}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-70"
                >
                  {state === 'sending' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.contact.sending}
                    </>
                  ) : (
                    t.contact.submit
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

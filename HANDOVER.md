# Handover: Anas Atallah Yaghi portfolio

This is the handover for the portfolio site, a standalone rebuild of the version that ran on
Base44 (`task-flow-pro-ba6e5db4.base44.app`). Read this first, then `README.md` for day-to-day
editing.

## What you are getting

- A complete website in English and Arabic (right-to-left), with light and dark themes, a home
  page, four case-study pages, a 404 page and a contact form.
- **All the text lives in two Markdown files**, `content/en.md` and `content/ar.md`. No database,
  no admin panel, no account.
- Contact-form messages are saved to a Markdown file, `messages/inbox.md`.
- Every page is prerendered to static HTML at build time, with titles, descriptions, link-preview
  tags and (once the site URL is set) canonical links, hreflang and a sitemap.
- 36 automated tests, a content checker, and a build that refuses to finish if the content has
  mistakes.

## State at handover

| Area | Status |
| --- | --- |
| Site, both languages, both themes | Done and checked in a browser |
| Case studies with highlights and architecture diagrams | Done; highlights and diagrams are **placeholders** |
| Contact form saving to `messages/inbox.md` | Done for local use (`npm run dev` / `npm run preview`) |
| Contact form on the live site | **Not built yet**: needs a Cloudflare Pages Function (see below) |
| Email, LinkedIn, CV, live-demo links, certificate dates and links | **Placeholders** to replace |
| Site URL (domain) | **Not set**: needed for link previews, canonical links and the sitemap |
| Deployment | **Not done**: planned for Cloudflare Pages |

## First run

Requires **Node 26** (the current LTS). The file `.node-version` pins it, and hosts such as
Cloudflare Pages read it automatically.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other commands:

```bash
npm run check      # content mistakes, then the list of placeholders still to replace
npm test           # all tests
npm run build      # static site in dist/
npm run preview    # serve dist/ locally; the contact form works here too
```

`npm run dev` and `npm run build` first run `scripts/images.js`, which makes WebP copies of the
images. The copies (`public/images/generated/`, `src/generated/`) are not in the zip; they are
recreated automatically.

## Before launch: replace the placeholders

Run `npm run check`. It ends with every dummy value and its line number, for example
`en.md:31 LinkedIn`. At handover there are 25:

- `# Site` in `content/en.md`: **Email**, **LinkedIn**, **CV**.
  Put the real CV in `public/cv/`, set `- CV: /cv/<file>.pdf`, and delete
  `public/cv/placeholder-cv.pdf`.
- Each project: **Live demo**, **Highlights**, **Diagram**.
  - Highlights are short facts shown as cards (`- Highlights: 45 automated tests, ...`). The
    current numbers are invented examples. Replace them with real ones, or empty the field to
    hide the cards. The Arabic versions are in `content/ar.md`.
  - Diagrams are in `public/images/diagrams/placeholder-*.svg` and say "Placeholder diagram"
    on them. Replace them with real diagrams (PNG, JPG or SVG in `public/images/`), or empty the
    field to hide the section.
- Each certificate: **Date** (`2024-08` style) and **Link**. `- File:` can point to a PDF in
  `public/` instead of, or as well as, the link.
- Also set **`- Site URL:`** under `# Site` (for example `https://anasyaghi.dev`). It must start
  with `https://`.

A line `<!-- placeholder: ... -->` marks the field right below it as dummy data. Delete that
line when you put in the real value.

## Contact form

- **Locally:** messages are saved to `messages/inbox.md`, one `##` entry per message, newest at
  the bottom. The folder is git-ignored and never served by the dev server, because it holds
  visitors' names and emails.
- **How it works:** the form posts JSON to `/api/contact`. `server/contact-inbox.js` (a Vite
  plugin, wired in `vite.config.js`) checks every field again, refuses anything that isn't JSON
  or is over 64 KB, and quotes the message so visitor text can't break the file's structure.
  Field length limits are shared by the form and the server in `src/lib/contact-limits.js`.
- **On the live site** there is no disk to write to, so the form needs a handler at the same
  address. On Cloudflare Pages that is a Pages Function, `functions/api/contact.js`, that stores
  messages in KV, D1 or R2 and can reuse `validateSubmission` and `formatEntry` from
  `server/contact-inbox.js`. Until then, the deployed form shows "Message not sent".
- **Alternative:** set `- Form endpoint:` under `# Contact` in `content/en.md` to a form
  service's address (for example a Formspree form), and the form posts there instead.

## Deploying to Cloudflare Pages (later)

1. Push the project to a GitHub repository.
2. In the Cloudflare dashboard, create a Pages project connected to that repository
   (Workers & Pages → Create; menu names may change over time).
3. Build command `npm run build`, output folder `dist`, Node version from `.node-version` (26).
4. Add the custom domain, then put the same address in `- Site URL:` and redeploy.
5. Optional: turn on Cloudflare Web Analytics (cookie-free visitor stats).
6. Add the contact Pages Function described above.

The build writes `_headers` (security headers, including a Content Security Policy, plus caching)
and `404.html` / `ar/404.html`, which Cloudflare Pages uses automatically.

After the first deploy, check:

- `/ar` and `/ar/projects/<slug>` open the Arabic pages. The build has both `ar.html` and an `ar/`
  folder, and this has not been tried on Cloudflare yet.
- Pasting a page link into a chat app shows the right title, description and image.
- A made-up address such as `/nope` shows the 404 page.

## How the project is organised

```
content/            en.md, ar.md: all the site's text (edit these)
public/images/      photo, project covers, diagrams/
public/cv/          the CV linked from the About section
server/             contact-inbox.js: saves form posts (dev and preview), with tests
scripts/            check-content.js (npm run check), images.js (WebP copies),
                    prerender.js (static HTML, sitemap, headers; last step of the build)
src/lib/            parse-content.js (Markdown to data), SiteContext.jsx (language and theme),
                    locale.js (/ar addresses), meta.js (page titles and tags),
                    i18n.js (button and label text), send-message.js and contact-limits.js
                    (contact form), utils.js
src/components/     Header, Footer, ProjectCard, Contact, sections.jsx, ui.jsx
src/pages/          Home, Project (case study), NotFound
src/entry-server.jsx  renders a page to HTML for prerender.js
```

Stack, all on their latest releases at handover (November 2026) and pinned exactly in
`package.json`: Node 26 LTS, Vite 8, React 19, React Router 8, Tailwind CSS 4, lucide-react 1,
marked 18, sharp (images), Vitest 5 (tests). Tailwind 4 has no config file: the theme is in
`src/index.css` (`@theme inline`). The site's own colour and font variables are named `--tone-*`
and `--family-*` so they never clash with Tailwind's `--color-*` and `--font-*`.

To stay current: run `npm outdated` now and then, upgrade, then run `npm test`, `npm run build`
and check the site in a browser (light and dark, English and Arabic, mobile menu, contact form).

## Design decisions worth knowing

- **Language is in the address:** English at `/`, Arabic at `/ar`. The language switch is a
  real link, so either language can be shared directly. The language choice is not stored in the
  browser; the address decides it.
- **Arabic falls back to English:** anything missing from `content/ar.md` (photos, links,
  technologies, dates) uses the English value, so it only needs translated text. Projects are
  matched by `- Slug:`; everything else by position, so keep both files in the same order.
- **Prerendering:** the HTML for each page is built at build time and the browser takes it over
  when it loads (hydration). Components avoid anything that would render differently in the
  browser on first load (saved theme, animations, dates).
- **The build fails on content mistakes**, so a typo in a section name can't ship silently.
  `npm run check` gives the details with line numbers.
- **Images:** keep originals in `public/images/` (JPG or PNG). WebP copies at 480, 960 and
  1600 px are made automatically and served at the size the screen needs. Two images with the
  same name but different extensions stop the build.

## Known limits

- With JavaScript turned off, the pages show their text (prerendered), but this has not been
  checked page by page.
- Sections fade in as you scroll, so on a very slow connection they stay hidden until the
  JavaScript has loaded.
- WebP copies are only remade when the original image changes. After changing the sizes or the
  quality in `scripts/images.js`, delete `public/images/generated/` once.
- Diagrams are shown at their original file size (no WebP copies). A PNG or JPG placed directly
  in `public/images/` at least gets its width and height set, so the page doesn't jump while it
  loads. Keep diagram files small (a few hundred KB).

# Anas Atallah Yaghi — portfolio

A standalone copy of the portfolio that was built on Base44
(`task-flow-pro-ba6e5db4.base44.app`). It looks and behaves like the original: English and Arabic
(right-to-left), light and dark themes, four case-study pages and the contact form. It needs no
Base44 account. **All the text lives in two Markdown files**, and contact messages are saved to one.

New here? Start with **[HANDOVER.md](HANDOVER.md)**: project state, what to replace before launch,
and how to deploy.

## Run it

Requires Node 26 (the current LTS; `.node-version` pins it for hosts such as Cloudflare Pages).

```bash
npm install
npm run dev        # http://localhost:5173, reloads when you save a content file
npm run check      # lists mistakes in the content files, then the placeholders left to replace
npm test           # parser, form, inbox and formatting tests
npm run build      # static site in dist/, one prerendered HTML file per page
npm run preview    # serve dist/ locally (the contact form works here too)
```

English pages live at `/` and `/projects/<slug>`, Arabic ones at `/ar` and `/ar/projects/<slug>`,
so either language can be linked to directly. The theme choice is remembered per browser.

## Edit the content

| File | What it holds |
| --- | --- |
| `content/en.md` | Everything on the site in English: profile, hero, about, projects and case studies, services, skills, education, certificates, contact. |
| `content/ar.md` | The Arabic text. Anything left out here uses the English value, so photos, links, technologies and dates only need to be set in `en.md`. |
| `public/images/` | Photo, project covers and diagrams. Refer to them as `/images/name.jpg`. WebP copies in several sizes are made automatically (`npm run images`, also run by `dev` and `build`). |
| `src/lib/i18n.js` | Interface text in both languages: menu labels, buttons, form labels and errors. |

How `content/en.md` is laid out:

```md
# Projects                       <- section; keep these names as they are
- Heading: Selected work         <- a field: "- Name: value". Empty value = hidden

## Event Ticketing Backend       <- one item (project, service, skill group, school, certificate)
- Slug: event-ticketing-backend  <- the page address: /projects/event-ticketing-backend
- Technologies: Django, DRF      <- lists are comma-separated

Short description shown on the card.   <- plain paragraphs are the text

### Problem                      <- case-study part: Overview, Problem, Solution,
                                    My role, Challenges, Results, or any title you like
Text of the part.
```

- **Add a project:** copy a whole `## ...` block in `en.md`, change it, and add a cover to
  `public/images/`. Add the Arabic version to `ar.md` with the same `- Slug:`.
- **Reorder** projects, services, skills or certificates by moving their blocks. In `ar.md`,
  everything except projects is matched to `en.md` by position, so keep both files in the same order.
- **Formatting** inside paragraphs: `**bold**`, `*italic*` and `[link text](https://...)`.
  Bullet lists and images are not supported in the text; `npm run check` flags list lines.
- A long field value can wrap onto the next line if that line is indented.
- **Case-study extras:** `- Highlights: 40+ tests, 12 endpoints` shows short facts as cards at the
  top of a case study; `- Diagram: /images/name.png` adds an architecture image after the text.
  Both are optional, and `ar.md` can translate the highlights.
- **`- Site URL:`** under `# Site` is the public address, e.g. `https://anas.dev`. Without it the
  site works, but link previews have no image and there is no sitemap or canonical link.
- `# Section` headings and field names stay in English in both files. Case-study headings
  (`### Problem` ...) may be in English or Arabic (`### المشكلة`, `### الحل`, `### دوري`,
  `### التحديات`, `### النتائج`, `### نظرة عامة`).
- Run `npm run check` after a big edit. It reports, with file and line number, unknown sections,
  misplaced headings, list lines, duplicate slugs, Arabic projects whose slug matches no English
  project, and sections where `ar.md` has a different number of items than `en.md`.

## Contact form

Messages are saved to **`messages/inbox.md`**, newest at the bottom, one `##` entry per message
with the sender's details and the message quoted below. This works while `npm run dev` or
`npm run preview` is running: the form posts to `/api/contact`, handled by
`server/contact-inbox.js`. The folder is git-ignored because it holds visitors' names and emails.

The handler checks every field again on the server (required fields, email shape, length limits),
accepts only JSON, and refuses bodies over 16 KB. The form also checks the fields before sending
and has a hidden field that filters out simple spam bots.

**On a deployed site** the form needs a handler at the same address, because a static host has no
disk to write to. For Cloudflare Pages that is a Pages Function at `functions/api/contact.js`
storing messages in KV, D1 or R2 (not built yet). Alternatively, `- Form endpoint:` under
`# Contact` in `content/en.md` sends the form to another address, such as a Formspree form.

## Placeholder data

Some values are dummy data to be replaced: the email, LinkedIn and CV under `# Site`, every
project's live demo, highlights and diagram, and each certificate's date and link. They use
`example.com` addresses, files named `placeholder-...` (`public/cv/placeholder-cv.pdf`,
`public/images/diagrams/placeholder-*.svg`), or a `<!-- placeholder ... -->` comment on the line
above. `npm run check` prints the full list with file and line numbers.

## Deploy

`npm run build` produces a static site in `dist/`. Every page is prerendered to its own HTML file
(`index.html`, `ar.html`, `projects/<slug>.html`, `ar/projects/<slug>.html`) with its title,
description, language, link-preview tags and, when the site URL is set, canonical and hreflang
links. It also writes `404.html` (plus an Arabic `ar/404.html`, which Cloudflare Pages uses under `/ar`), `robots.txt`, `sitemap.xml` (needs the site URL) and `_headers`
(security headers, including a Content Security Policy, and long caching for built assets).

- **Cloudflare Pages** (recommended): build command `npm run build`, output folder `dist`. Clean
  addresses, `404.html` and `_headers` work as is. Optional: turn on Cloudflare Web Analytics in
  the dashboard for cookie-free visitor stats.
- **Netlify:** same build command and folder; `_headers` and `404.html` work as is.
- **Vercel:** add `vercel.json` with `{ "cleanUrls": true }`; `_headers` is ignored there, so copy
  its rules into `vercel.json` if you need them.

`SITE_URL` can be set as a build environment variable instead of `- Site URL:`. After deploying,
open a case-study address directly and paste a page link into a chat app to check the preview.

## Changes from the Base44 version

- Content comes from Markdown instead of the Base44 database and admin panel.
- Images are stored in the project and resized for the web. The original covers were 2400 px
  wide; these are 1600 px, served as WebP in the size the screen needs (a cover is 18–85 KB, the
  photo 24–60 KB instead of 971 KB).
- The saved theme is applied before the first paint, so returning visitors no
  longer see a flash of the wrong theme.
- Contact messages go to a Markdown file instead of the Base44 database; the form has a spam
  trap and marks invalid fields for screen readers.
- The Base44 badge, visitor tracking, login, admin and inbox pages are gone.
- Pages are prerendered, so search engines and link previews get the real text in both languages.
- Each language has its own address (`/ar/...`), and the language switch is a real link.

## Code map

```
content/            en.md, ar.md: the site's text
messages/           inbox.md: saved contact messages (git-ignored, created on the first message)
public/images/      photo, project covers, diagrams/
public/cv/          the CV linked from the about section
server/             contact-inbox.js: saves form posts to messages/inbox.md (dev and preview)
scripts/            check-content.js (npm run check), images.js (WebP copies),
                    prerender.js (static HTML, sitemap, headers; last step of the build)
src/entry-server.jsx  renders a page to HTML for prerender.js
src/lib/            parse-content.js (Markdown -> data), SiteContext.jsx (language/theme),
                    locale.js (/ar addresses), meta.js (titles and tags per page),
                    i18n.js (interface text), send-message.js (contact form), utils.js
src/components/     Header, Footer, ProjectCard, Contact, sections.jsx (home sections), ui.jsx
src/pages/          Home, Project (case study), NotFound
```

Stack (latest releases as of November 2026, pinned exactly in `package.json`): Node 26 LTS, Vite 8,
React 19, React Router 8, Tailwind CSS 4 (configured in `src/index.css`), lucide-react 1, marked 18,
sharp for images, Vitest 5 for tests. Check for newer versions with `npm outdated`.

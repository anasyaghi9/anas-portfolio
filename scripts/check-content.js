// Checks content/en.md and content/ar.md and lists anything the site would ignore or get wrong.
// Run with: npm run check
import { readFileSync } from 'node:fs';
import { buildContent, findPlaceholders } from '../src/lib/parse-content.js';

const read = (name) => readFileSync(new URL(`../content/${name}`, import.meta.url), 'utf8');

const sources = { 'en.md': read('en.md'), 'ar.md': read('ar.md') };
const { en, warnings } = buildContent(sources['en.md'], sources['ar.md']);

if (warnings.length > 0) {
  console.error(`Found ${warnings.length} problem(s):\n- ${warnings.join('\n- ')}`);
  process.exit(1);
}

console.log(
  `Content OK: ${en.projects.items.length} projects, ${en.services.items.length} services, ` +
    `${en.skills.items.length} skill groups, ${en.education.items.length} education, ` +
    `${en.certifications.items.length} certificates.`,
);

// Dummy data is allowed while the site is being built; this list is the to-do before launch.
const placeholders = Object.entries(sources).flatMap(([label, text]) => findPlaceholders(text, label));
if (placeholders.length > 0) {
  console.log(`\n${placeholders.length} placeholder value(s) to replace before launch:\n- ${placeholders.join('\n- ')}`);
}

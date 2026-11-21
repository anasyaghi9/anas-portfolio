import enSource from '../../content/en.md?raw';
import arSource from '../../content/ar.md?raw';
import { buildContent } from './parse-content.js';

/** Parsed site content for both languages. Vite reloads the page when either .md file changes. */
export const content = buildContent(enSource, arSource);

if (import.meta.env.DEV && content.warnings.length > 0) {
  console.warn(`[content] ${content.warnings.length} problem(s) in content/*.md:\n- ${content.warnings.join('\n- ')}`);
}

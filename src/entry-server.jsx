import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { AppShell } from './App.jsx';
import { content } from './lib/content.js';

export { content };
export { pageMeta, sitePaths } from './lib/meta.js';

/** Build-time only (scripts/prerender.js): the HTML of one address. */
export function render(url) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppShell />
      </StaticRouter>
    </StrictMode>,
  );
}

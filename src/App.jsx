import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigationType } from 'react-router';
import { pageMeta } from './lib/meta.js';
import { SiteProvider } from './lib/SiteContext.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import Project from './pages/Project.jsx';

/**
 * On each link click: jump to the #section if the URL has one, otherwise to the top.
 * Back and Forward are left to the browser, which restores the previous scroll position.
 * Switching language keeps the reader where they are.
 */
function ScrollManager() {
  const { key, hash, state } = useLocation();
  const navigationType = useNavigationType();
  const keepScroll = Boolean(state?.keepScroll);

  useEffect(() => {
    if (navigationType === 'POP' || keepScroll) return undefined;
    // Wait a frame so the target section is rendered.
    const frame = requestAnimationFrame(() => {
      const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) target.scrollIntoView();
      else window.scrollTo({ top: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [key, hash, navigationType, keepScroll]);

  return null;
}

/** Keeps the tab title and description in step with the page. The prerender writes the same values. */
function MetaManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = pageMeta(pathname);
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  }, [pathname]);

  return null;
}

/** The site without its router, shared by the browser (BrowserRouter) and the prerender (StaticRouter). */
export function AppShell() {
  return (
    <SiteProvider>
      <ScrollManager />
      <MetaManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/:slug" element={<Project />} />
        <Route path="/ar" element={<Home />} />
        <Route path="/ar/projects/:slug" element={<Project />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SiteProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

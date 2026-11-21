import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { content } from './content.js';
import { strings } from './i18n.js';
import { localePath, parseLocalePath } from './locale.js';

const THEME_KEY = 'anas-theme';

const SiteContext = createContext(null);

function readTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function storeTheme(value) {
  try {
    window.localStorage.setItem(THEME_KEY, value);
  } catch {
    // Storage can be blocked (private mode); the choice then lasts for this visit only.
  }
}

/** Language comes from the address (/ar/...); the theme from the visitor's saved choice. Must sit inside a router. */
export function SiteProvider({ children }) {
  const location = useLocation();
  const { lang, path } = parseLocalePath(location.pathname);

  // Prerendered HTML is always light. Start the same way so hydration matches, then pick up the
  // saved theme; the inline script in index.html has already painted the right colours.
  const [theme, setTheme] = useState('light');
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    storeTheme(theme);
  }, [theme, themeReady]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const otherLang = lang === 'ar' ? 'en' : 'ar';
  const otherLangHref = localePath(path, otherLang) + location.hash;
  const href = useCallback((to) => localePath(to, lang), [lang]);
  const toggleTheme = useCallback(() => setTheme((v) => (v === 'dark' ? 'light' : 'dark')), []);

  const value = useMemo(
    () => ({
      theme,
      lang,
      isRtl: lang === 'ar',
      t: strings[lang],
      data: content[lang],
      href,
      otherLang,
      otherLangHref,
      toggleTheme,
    }),
    [theme, lang, href, otherLang, otherLangHref, toggleTheme],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
}

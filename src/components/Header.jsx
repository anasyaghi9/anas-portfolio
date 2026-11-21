import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useSite } from '../lib/SiteContext.jsx';
import { SECTION_IDS } from '../lib/i18n.js';
import { cn } from '../lib/utils.js';
import { SectionLink } from './ui.jsx';

const DESKTOP_QUERY = '(min-width: 1024px)';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep Tab and Shift+Tab inside `container`. */
function trapTab(e, container) {
  const items = [...container.querySelectorAll(FOCUSABLE)];
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === container)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Slide-in panel for the mobile menu, rendered into <body> so the header's backdrop blur cannot
 * shrink it. Closes on Escape, backdrop click, link click, or when the window grows to desktop width.
 */
function Sheet({ open, onClose, side, label, closeLabel, children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // <body> only exists in the browser; the prerendered HTML has no menu panel.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const close = () => onCloseRef.current();
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && panelRef.current) trapTab(e, panelRef.current);
    };
    const onViewport = (e) => e.matches && close();
    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onViewport);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onViewport);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open]);

  if (!mounted) return null;
  return createPortal(
    <div className={cn('fixed inset-0 z-60 lg:hidden', !open && 'pointer-events-none')} aria-hidden={!open}>
      <div
        className={cn('absolute inset-0 bg-black/50 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        inert={!open}
        className={cn(
          'absolute inset-y-0 w-[85vw] max-w-sm border-border bg-background shadow-xl outline-hidden transition-transform duration-300 ease-out',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          open ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute inset-e-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function Header({ onHome = true }) {
  const { t, theme, toggleTheme, lang, otherLang, otherLangHref, href, isRtl, data } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const name = data.site.name;
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-border/70 bg-background/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <Link to={href('/')} className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/15 font-mono text-[11px] tracking-[0.08em] transition-colors group-hover:border-foreground/40">
            {data.site.initials}
          </span>
          <span className="hidden text-sm font-medium tracking-tight sm:block">{name}</span>
        </Link>

        <nav aria-label={t.footer.sections} className="hidden items-center gap-6 lg:flex">
          {SECTION_IDS.map((id) => (
            <SectionLink
              key={id}
              id={id}
              onHome={onHome}
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.nav[id]}
            </SectionLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t.common.theme}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ThemeIcon className="h-4 w-4" />
          </button>
          <Link
            to={otherLangHref}
            state={{ keepScroll: true }}
            hrefLang={otherLang}
            lang={otherLang}
            aria-label={t.common.language}
            className="flex h-9 items-center rounded-full px-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {lang === 'en' ? 'العربية' : 'EN'}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t.common.menu}
            aria-expanded={menuOpen}
            className="ms-1 flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Sheet
        open={menuOpen}
        onClose={closeMenu}
        side={isRtl ? 'left' : 'right'}
        label={t.common.menu}
        closeLabel={t.common.close}
      >
        <div className="flex h-full flex-col justify-between p-8">
          <div>
            <p className="label-mono">{name}</p>
            <nav className="mt-10 flex flex-col gap-1">
              {SECTION_IDS.map((id) => (
                <SectionLink
                  key={id}
                  id={id}
                  onHome={onHome}
                  onClick={closeMenu}
                  className="border-b border-border/60 py-3 font-display text-2xl font-medium tracking-tight text-foreground"
                >
                  {t.nav[id]}
                </SectionLink>
              ))}
            </nav>
          </div>
          <div className="mt-10 flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-medium"
            >
              <ThemeIcon className="h-4 w-4" />
              {t.common.theme}
            </button>
          </div>
        </div>
      </Sheet>
    </header>
  );
}

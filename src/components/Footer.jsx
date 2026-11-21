import { ArrowUpRight } from 'lucide-react';
import { useSite } from '../lib/SiteContext.jsx';
import { SECTION_IDS } from '../lib/i18n.js';
import { SectionLink } from './ui.jsx';

export default function Footer({ onHome = true }) {
  const { t, data } = useSite();
  const { site } = data;
  const links = [
    site.github ? { label: 'GitHub', href: site.github } : null,
    site.linkedin ? { label: 'LinkedIn', href: site.linkedin } : null,
    site.email ? { label: t.common.email, href: `mailto:${site.email}` } : null,
  ].filter(Boolean);

  return (
    <footer className="border-t border-border/70 py-12 md:py-16">
      <div className="container-page grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-lg font-medium tracking-tight text-foreground">{site.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{site.title}</p>
        </div>
        <nav aria-label={t.footer.sections} className="md:col-span-4">
          <p className="label-mono">{t.footer.sections}</p>
          <ul className="mt-4 grid grid-cols-2 gap-y-2">
            {SECTION_IDS.map((id) => (
              <li key={id}>
                <SectionLink
                  id={id}
                  onHome={onHome}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav[id]}
                </SectionLink>
              </li>
            ))}
          </ul>
        </nav>
        {links.length > 0 ? (
          <div className="md:col-span-3">
            <p className="label-mono">{t.footer.connect}</p>
            <ul className="mt-4 space-y-2">
              {links.map((link) => {
                const external = !link.href.startsWith('mailto:');
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="container-page mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6">
        {/* The year can differ from the prerendered page after New Year; that is expected. */}
        <p suppressHydrationWarning className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          © {new Date().getFullYear()} {site.name}. {t.footer.rights}
        </p>
        {site.footerTagline ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{site.footerTagline}</p>
        ) : null}
      </div>
    </footer>
  );
}

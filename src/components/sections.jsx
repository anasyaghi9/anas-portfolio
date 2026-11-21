import { ArrowDownRight, ArrowUpRight, FileText } from 'lucide-react';
import { useSite } from '../lib/SiteContext.jsx';
import { formatMonth, pad } from '../lib/utils.js';
import { EmptyProjectCard, ProjectCard } from './ProjectCard.jsx';
import { Img, Reveal, Rich, SectionHeading } from './ui.jsx';

const MIN_PROJECT_SLOTS = 4;

export function Hero() {
  const { t, data } = useSite();
  const { site, hero } = data;

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 inset-e-[-10%] h-[520px] w-[520px] rounded-full opacity-[0.07] blur-3xl"
        style={{ background: 'hsl(var(--tone-accent))' }}
      />
      <div className="container-page relative">
        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
              <p className="label-mono text-foreground/70">{hero.eyebrow}</p>
            </div>
            <h1 className="mt-6 font-display text-[clamp(2.35rem,6vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.035em] text-foreground">
              {hero.headline} <span className="text-muted-foreground">{hero.headlineMuted}</span>
            </h1>
            {hero.summary ? (
              <Rich text={hero.summary} className="mt-7 max-w-xl text-[1.0625rem] leading-[1.75] text-muted-foreground" />
            ) : null}
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href="#projects"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5"
              >
                {t.hero.ctaProjects}
                <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </a>
              <a
                href="#contact"
                className="group inline-flex items-center gap-1.5 border-b border-foreground/25 pb-1 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                {t.hero.ctaContact}
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
            {hero.tags.length > 0 ? (
              <ul className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {hero.tags.map((tag, i) => (
                  <li key={tag} className="flex items-center gap-3">
                    {i > 0 ? (
                      <span aria-hidden="true" className="text-border">
                        /
                      </span>
                    ) : null}
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
              <div aria-hidden="true" className="absolute inset-x-3 -bottom-3 top-3 rounded-[1.9rem] border border-border" />
              <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0B0B0B] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]">
                {site.photo ? (
                  <Img
                    src={site.photo}
                    alt={site.name || 'Portrait'}
                    sizes="(min-width: 1024px) 480px, 420px"
                    className="aspect-4/5 w-full"
                    eager
                  />
                ) : (
                  <div className="surface-grid aspect-4/5 w-full" />
                )}
              </div>
              <div className="mt-5 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{site.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{site.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  const { t, data } = useSite();
  const { site, about, education } = data;
  const school = education.items[0];
  const schoolLine = school ? [school.institution, school.qualification].filter(Boolean).join(' — ') : '—';

  return (
    <section id="about" className="section-shell">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <SectionHeading index="01" label={t.nav.about} title={about.heading || t.sections.about.title} />
        </Reveal>
        <Reveal className="lg:col-span-7" delay={0.05}>
          <div className="space-y-5 text-[1.0625rem] leading-[1.8] text-muted-foreground">
            {about.paragraphs.map((p, i) => (
              <Rich key={i} text={p} />
            ))}
          </div>
          <dl className="mt-10 grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
            <div>
              <dt className="label-mono">{t.about.education}</dt>
              <dd className="mt-2 text-sm text-foreground">{schoolLine}</dd>
            </div>
            <div>
              <dt className="label-mono">{t.about.focus}</dt>
              <dd className="mt-2 text-sm text-foreground">{site.focus || '—'}</dd>
            </div>
          </dl>
          {site.cv ? (
            <a
              href={site.cv}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {t.about.downloadCv}
            </a>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}

export function Projects() {
  const { t, data } = useSite();
  const { projects } = data;
  const slots = Math.max(MIN_PROJECT_SLOTS, projects.items.length);

  return (
    <section id="projects" className="section-shell">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            index="02"
            label={t.nav.projects}
            title={projects.heading || t.sections.projects.title}
            description={projects.intro}
          />
        </Reveal>
        <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2">
          {Array.from({ length: slots }, (_, i) => {
            const project = projects.items[i];
            return (
              <Reveal key={project?.slug ?? `empty-${i}`} delay={(i % MIN_PROJECT_SLOTS) * 0.04}>
                {project ? <ProjectCard project={project} index={i + 1} /> : <EmptyProjectCard index={i + 1} />}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Services() {
  const { t, data } = useSite();
  const { services } = data;

  return (
    <section id="services" className="section-shell">
      <div className="container-page">
        <Reveal>
          <SectionHeading index="03" label={t.nav.services} title={services.heading || t.sections.services.title} />
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {services.items.map((service, i) => (
            <Reveal key={`${i}-${service.title}`} delay={i * 0.04} className="bg-background">
              <div className="flex h-full flex-col gap-4 p-7 md:p-9">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{pad(i + 1)}</span>
                <h3 className="font-display text-xl font-medium tracking-tight text-foreground">{service.title}</h3>
                <Rich text={service.description} className="text-sm leading-relaxed text-muted-foreground" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Skills() {
  const { t, data } = useSite();
  const { skills } = data;

  return (
    <section id="skills" className="section-shell">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <SectionHeading index="04" label={t.nav.skills} title={skills.heading || t.sections.skills.title} />
        </Reveal>
        <div className="lg:col-span-8">
          <dl className="divide-y divide-border border-t border-border">
            {skills.items.map((group, i) => (
              <Reveal key={`${i}-${group.name}`} delay={i * 0.03} className="grid gap-3 py-6 sm:grid-cols-3 sm:gap-8">
                <dt className="label-mono pt-1">{group.name}</dt>
                <dd className="sm:col-span-2">
                  <ul className="flex flex-wrap gap-x-2 gap-y-2">
                    {group.items.map((skill, j) => (
                      <li key={`${j}-${skill}`} className="rounded-full bg-secondary px-3 py-1.5 text-[13px] text-foreground">
                        {skill}
                      </li>
                    ))}
                  </ul>
                  {group.note ? (
                    <Rich text={group.note} className="mt-3 text-xs leading-relaxed text-muted-foreground" />
                  ) : null}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function Education() {
  const { t, lang, data } = useSite();
  const { education } = data;

  return (
    <section id="education" className="section-shell">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <SectionHeading index="05" label={t.nav.education} title={education.heading || t.sections.education.title} />
        </Reveal>
        <div className="lg:col-span-8">
          <div className="space-y-10">
            {education.items.map((item, i) => {
              const dates = [formatMonth(item.start, lang), formatMonth(item.end, lang)].filter(Boolean).join(' — ');
              return (
                <Reveal key={`${i}-${item.institution}`} delay={i * 0.04}>
                  <article className="border-t border-border pt-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display text-xl font-medium tracking-tight text-foreground">{item.institution}</h3>
                      {dates ? (
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{dates}</p>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      {[item.qualification, item.field].filter(Boolean).join(' · ')}
                    </p>
                    {item.description ? (
                      <Rich text={item.description} className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground" />
                    ) : null}
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Certifications() {
  const { t, lang, data } = useSite();
  const { certifications } = data;
  const iconLink = 'text-muted-foreground transition-colors hover:text-foreground';

  return (
    <section id="certifications" className="section-shell">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <SectionHeading
            index="06"
            label={t.nav.certifications}
            title={certifications.heading || t.sections.certifications.title}
          />
        </Reveal>
        <div className="lg:col-span-8">
          <ul className="divide-y divide-border border-t border-border">
            {certifications.items.map((cert, i) => (
              <Reveal as="li" key={`${i}-${cert.title}`} delay={i * 0.03} className="group flex items-start justify-between gap-6 py-6">
                <div>
                  <h3 className="font-display text-lg font-medium tracking-tight text-foreground">{cert.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[cert.issuer, formatMonth(cert.date, lang)].filter(Boolean).join(' · ')}
                  </p>
                  {cert.description ? (
                    <Rich text={cert.description} className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground" />
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3 pt-1">
                  {cert.file ? (
                    <a href={cert.file} target="_blank" rel="noreferrer" aria-label={cert.title} className={iconLink}>
                      <FileText className="h-4 w-4" />
                    </a>
                  ) : null}
                  {cert.link ? (
                    <a href={cert.link} target="_blank" rel="noreferrer" aria-label={cert.title} className={iconLink}>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import { ProjectCover } from '../components/ProjectCard.jsx';
import { GithubIcon, imageSize, Reveal, Rich } from '../components/ui.jsx';
import { useSite } from '../lib/SiteContext.jsx';
import NotFound from './NotFound.jsx';

const BODY = 'whitespace-pre-line text-[1.0625rem] leading-[1.8] text-muted-foreground lg:col-span-8 lg:col-start-5';
const TECH_PILL =
  'rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground';

export default function Project() {
  const { slug } = useParams();
  const { t, data, href } = useSite();
  const index = data.projects.items.findIndex((p) => p.slug === slug);
  const project = data.projects.items[index];

  if (!project) return <NotFound title={t.common.notFoundTitle} body={t.common.notFoundBody} />;

  return (
    <div className="min-h-screen bg-background">
      <Header onHome={false} />
      <main className="pt-28 md:pt-36">
        <article className="container-page">
          <Link
            to={href('/#projects')}
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 group-hover:rtl:translate-x-0.5" />
            {t.caseStudy.back}
          </Link>

          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="label-mono">{t.caseStudy.eyebrow}</p>
              <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.6rem)] font-medium leading-[1.04] tracking-[-0.03em] text-foreground">
                {project.title}
              </h1>
              <Rich text={project.summary} className="mt-6 max-w-2xl text-[1.0625rem] leading-[1.75] text-muted-foreground" />
            </div>
            <div className="lg:col-span-4 lg:pt-2">
              <p className="label-mono">{t.caseStudy.links}</p>
              <div className="mt-4 flex flex-col gap-2">
                {project.github ? (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <GithubIcon className="h-4 w-4 text-muted-foreground" />
                    {t.common.github}
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                ) : null}
                {project.liveDemo ? (
                  <a
                    href={project.liveDemo}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    {t.common.liveDemo}
                  </a>
                ) : null}
                {project.technologies.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <li key={tech} className={TECH_PILL}>
                        {tech}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <Reveal className="mt-12">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              <ProjectCover
                project={project}
                index={index + 1}
                sizes="(min-width: 1240px) 1200px, 100vw"
                className="aspect-video w-full"
                eager
              />
            </div>
          </Reveal>

          {project.highlights.length > 0 ? (
            <Reveal className="mt-10">
              <h2 className="sr-only">{t.caseStudy.highlights}</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {project.highlights.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-border bg-card px-6 py-5 font-display text-base font-medium tracking-tight text-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          <div className="mt-16">
            {project.parts.map((part, i) => (
              <Reveal key={part.key} delay={i * 0.03}>
                <section className="grid gap-4 border-t border-border py-10 lg:grid-cols-12 lg:gap-6">
                  <div className="lg:col-span-3">
                    <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
                      {t.caseStudy.parts[part.key] ?? part.title}
                    </h2>
                  </div>
                  <div className={`${BODY} space-y-5`}>
                    {part.body.split('\n\n').map((p, j) => (
                      <Rich key={j} text={p} />
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}
            {project.diagram ? (
              <Reveal>
                <section className="grid gap-4 border-t border-border py-10 lg:grid-cols-12 lg:gap-6">
                  <h2 className="font-display text-lg font-medium tracking-tight text-foreground lg:col-span-3">
                    {t.caseStudy.diagram}
                  </h2>
                  {/* Shown whole (not cropped), on white so transparent diagrams stay readable in dark mode. */}
                  <img
                    src={project.diagram}
                    alt={`${t.caseStudy.diagram}: ${project.title}`}
                    {...imageSize(project.diagram)}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-xl border border-border bg-white lg:col-span-9"
                  />
                </section>
              </Reveal>
            ) : null}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-border py-12">
            <p className="max-w-md font-display text-xl font-medium tracking-tight text-foreground">
              {data.contact.heading || t.sections.contact.title}
            </p>
            <Link
              to={href('/#contact')}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground"
            >
              {t.hero.ctaContact}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </main>
      <Footer onHome={false} />
    </div>
  );
}

import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { useSite } from '../lib/SiteContext.jsx';
import { cn, pad } from '../lib/utils.js';
import { Img, Rich } from './ui.jsx';

const EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]';

/** Project cover image, or a dark grid placeholder with the title when there is no image. */
export function ProjectCover({ project, index, className, sizes, eager = false }) {
  if (project.image) {
    return <Img src={project.image} alt={project.title} className={className} sizes={sizes} eager={eager} />;
  }
  return (
    <div className={cn('relative overflow-hidden bg-[#101010]', className)}>
      <div className="surface-grid absolute inset-0 opacity-[0.18]" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-between p-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{pad(index)}</span>
        <span className="font-display text-2xl font-medium leading-tight tracking-tight text-white/85">
          {project.title}
        </span>
      </div>
    </div>
  );
}

export function ProjectCard({ project, index }) {
  const { t, href } = useSite();
  const frameRef = useRef(null);

  const onPointerMove = (e) => {
    const frame = frameRef.current;
    if (!frame || e.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = frame.getBoundingClientRect();
    frame.style.setProperty('--px', ((e.clientX - box.left) / box.width - 0.5).toFixed(3));
    frame.style.setProperty('--py', ((e.clientY - box.top) / box.height - 0.5).toFixed(3));
  };

  const onPointerLeave = () => {
    frameRef.current?.style.setProperty('--px', '0');
    frameRef.current?.style.setProperty('--py', '0');
  };

  return (
    <Link
      to={href(`/projects/${project.slug}`)}
      className={`group block rounded-2xl transition-transform duration-300 ${EASE} will-change-transform hover:-translate-y-1.5 active:-translate-y-1`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-border bg-muted transition-[border-color,box-shadow] duration-300 ${EASE} group-hover:border-foreground/25 group-hover:shadow-[0_22px_45px_-22px_rgba(0,0,0,0.4)]`}
      >
        <div ref={frameRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className="relative aspect-16/10 w-full">
          <div
            className={`absolute inset-0 transition-transform duration-300 ${EASE} will-change-transform`}
            style={{ transform: 'translate3d(calc(var(--px, 0) * 6px), calc(var(--py, 0) * 6px), 0)' }}
          >
            <ProjectCover
              project={project}
              index={index}
              sizes="(min-width: 1240px) 600px, (min-width: 768px) 50vw, 100vw"
              className={`h-full w-full transition-transform duration-300 ${EASE} group-hover:scale-[1.06] group-active:scale-[1.04]`}
            />
          </div>
          <div
            className={`pointer-events-none absolute inset-0 flex items-end justify-between gap-4 bg-linear-to-t from-black/80 via-black/30 to-transparent p-5 opacity-0 transition-opacity duration-300 ${EASE} group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100`}
          >
            <span
              className={`translate-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/90 transition-transform duration-300 ${EASE} group-hover:translate-y-0`}
            >
              {t.common.viewCaseStudy}
            </span>
            <span
              className={`flex h-8 w-8 shrink-0 translate-y-2 items-center justify-center rounded-full border border-white/35 text-white transition-transform duration-300 ${EASE} group-hover:translate-y-0`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <h3 className="font-display text-xl font-medium tracking-tight text-foreground">{project.title}</h3>
          <Rich text={project.summary} className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground" />
        </div>
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-foreground group-hover:text-foreground">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-2 gap-y-1.5">
        {project.technologies.map((tech) => (
          <li
            key={tech}
            className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            {tech}
          </li>
        ))}
      </ul>
    </Link>
  );
}

/** Dashed placeholder shown when there are fewer than four projects. */
export function EmptyProjectCard({ index }) {
  const { t } = useSite();
  return (
    <div className="flex aspect-16/10 w-full items-center justify-center rounded-2xl border border-dashed border-border/80">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{pad(index)}</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">{t.common.openSlot}</p>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useSite } from '../lib/SiteContext.jsx';
import { cn, inlineMarkdown } from '../lib/utils.js';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ children, className, delay = 0, y = 18, as: Tag = 'div' }) {
  const ref = useRef(null);
  // Hidden on the first render in both the prerender and the browser, so hydration matches.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return undefined;
    const node = ref.current;
    if (!node || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-80px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'reveal-in', className)}
      style={{ '--reveal-y': `${y}px`, '--reveal-delay': `${delay}s` }}
    >
      {children}
    </Tag>
  );
}

// Written by scripts/images.js (runs before dev and build). Missing in tests, hence the glob.
const manifests = import.meta.glob('../generated/images.json', { eager: true, import: 'default' });
const IMAGES = Object.values(manifests)[0] ?? {};

/** Width and height of a local image, so the page doesn't jump when it loads. */
export const imageSize = (src) => ({ width: IMAGES[src]?.width, height: IMAGES[src]?.height });

/**
 * Cover-fit image that blurs in once loaded. `className` sizes the frame (e.g. aspect ratio);
 * `sizes` tells the browser how wide it is drawn, so it can pick the smallest WebP copy.
 */
export function Img({ src, alt, className, sizes = '100vw', eager = false }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const info = IMAGES[src];

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <span className={cn('relative block overflow-hidden', className)}>
      <picture>
        {info ? (
          <source type="image/webp" sizes={sizes} srcSet={info.webp.map((v) => `${v.src} ${v.width}w`).join(', ')} />
        ) : null}
        <img
          ref={ref}
          src={src}
          alt={alt}
          width={info?.width}
          height={info?.height}
          loading={eager ? 'eager' : 'lazy'}
          fetchpriority={eager ? 'high' : undefined}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn(
            'img-fade absolute inset-0 h-full w-full object-cover transition-[opacity,filter,transform] duration-700',
            loaded ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-0 blur-xl',
          )}
        />
      </picture>
    </span>
  );
}

/** A paragraph of content text with inline Markdown (bold, italic, links). */
export function Rich({ text, as: Tag = 'p', className }) {
  return <Tag className={className} dangerouslySetInnerHTML={inlineMarkdown(text)} />;
}

/** Link to a home-page section: a plain anchor on the home page, a router link elsewhere. */
export function SectionLink({ id, onHome, className, onClick, children }) {
  const { href } = useSite();
  if (onHome) {
    return (
      <a href={`#${id}`} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href(`/#${id}`)} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/** "01 —— ABOUT" label, section title and optional intro line. */
export function SectionHeading({ index, label, title, description, className }) {
  return (
    <div className={cn('max-w-2xl', className)}>
      <div className="flex items-center gap-4">
        <span className="label-mono">{index}</span>
        <span aria-hidden="true" className="h-px w-10 bg-border" />
        <span className="label-mono">{label}</span>
      </div>
      <h2 className="mt-5 font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-medium leading-[1.06] tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-xl text-[0.975rem] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

/** GitHub mark (lucide dropped brand icons, so it is inlined here). */
export function GithubIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

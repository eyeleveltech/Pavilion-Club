import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { preload } from 'react-dom';

import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { cx } from '@/components/public/book/ui';
import { EnquiryForm, type EnquiryField } from '@/components/public/site/EnquiryForm';
import { MOTION_SCRIPTS } from '@/components/public/site/motionScripts';
import { SiteMotion } from '@/components/public/site/SiteMotion';
import { isHomeLink } from '@/lib/club';

/**
 * The frame for the club's information pages (memberships, academy, events,
 * franchise, rules, FAQs, policies), built in the home page's language: a
 * full-bleed hero, masked line reveals, hairline rows and GSAP motion
 * (SiteMotion). Styles are the .site-* classes in globals.css.
 */

// Hides the animated elements before first paint; SiteMotion reveals them.
// If the motion scripts never arrive, the content shows after five seconds.
const MOTION_BOOT =
  "(function(d){d.documentElement.classList.add('site-motion');setTimeout(function(){if(!window.__siteMotion)d.documentElement.classList.add('site-motion-off')},5000)})(document)";

export function SitePage({ children }: { children: ReactNode }) {
  MOTION_SCRIPTS.forEach(([, src]) => preload(src, { as: 'script' }));
  return (
    <>
      <link rel="stylesheet" href="/assets/fonts/fonts.css" />
      <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
      <div className="site-root flex min-h-svh flex-col bg-ivory font-sans text-navy antialiased">
        <PublicHeader overlay />
        <main id="main" className="flex-1">
          {children}
        </main>
        <PublicFooter />
      </div>
      <SiteMotion />
    </>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Each entry is one masked line that slides up into place. */
function Lines({ lines }: { lines: readonly ReactNode[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="ln">
          <span>{line}</span>
        </span>
      ))}
    </>
  );
}

/**
 * A full-bleed photograph under the header, the title at the bottom left and
 * the lede and actions beside it, as on the home page. Without an image it
 * becomes a shorter typographic hero, for the policy pages.
 */
export function PageHero({
  eyebrow,
  lines,
  lede,
  tag,
  image,
  imagePosition,
  side,
  compact = false,
  children,
}: {
  eyebrow: string;
  lines: readonly ReactNode[];
  lede?: ReactNode;
  /** A short gold line above the lede, e.g. "Two ways to join". */
  tag?: string;
  image?: string;
  imagePosition?: string;
  /** Vertical text at the right edge, e.g. "Open daily from 06:00 AM". */
  side?: string;
  /** A smaller title, for long ones. */
  compact?: boolean;
  /** Buttons and links under the lede. */
  children?: ReactNode;
}) {
  return (
    <section className={cx('site-hero', !image && 'site-hero--plain')}>
      {image ? (
        <>
          <div className="site-hero__media">
            <img src={image} alt="" fetchPriority="high" style={imagePosition ? { objectPosition: imagePosition } : undefined} />
          </div>
          <div className="site-hero__veil" aria-hidden="true" />
        </>
      ) : null}
      {/* Outside __inner: SiteMotion transforms __inner, which would move this. */}
      <div className="site-hero__meta" data-fade>
        <span>{eyebrow}</span>
        <span>Mogappair East · Chennai</span>
      </div>
      <div className="site-hero__inner">
        <h1 className={cx('site-display', compact && 'site-display--m')} data-lines>
          <Lines lines={lines} />
        </h1>
        {tag || lede || children ? (
          <div className="site-hero__aside">
            {tag ? (
              <p className="site-hero__tag" data-fade>
                {tag}
              </p>
            ) : null}
            {lede ? (
              <div className="site-lede" data-fade>
                {lede}
              </div>
            ) : null}
            {children ? (
              <div className="site-actions" data-fade>
                {children}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {side ? (
        <div className="site-hero__side" aria-hidden="true">
          {side}
        </div>
      ) : null}
    </section>
  );
}

/** The gold marquee under the hero; it speeds up while the page scrolls. */
export function Ticker({ items }: { items: readonly string[] }) {
  const row = (
    <div className="site-ticker__item">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
  return (
    <div className="site-ticker" aria-hidden="true">
      <div className="site-ticker__track">
        {row}
        {row}
      </div>
    </div>
  );
}

/** Eyebrow and a display heading, with an intro beside it on wide screens. */
export function SectionHead({
  eyebrow,
  lines,
  intro,
  className,
}: {
  eyebrow: string;
  lines: readonly ReactNode[];
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('site-head', className)}>
      <div>
        <p className="site-eyebrow" data-fade>
          {eyebrow}
        </p>
        <Heading lines={lines} className="mt-7" />
      </div>
      {intro ? (
        <div className="site-lede site-head__intro" data-fade>
          {intro}
        </div>
      ) : null}
    </div>
  );
}

export function Heading({
  lines,
  as: Tag = 'h2',
  className,
}: {
  lines: readonly ReactNode[];
  as?: 'h2' | 'h3';
  className?: string;
}) {
  return (
    <Tag className={cx('site-h2', className)} data-lines>
      <Lines lines={lines} />
    </Tag>
  );
}

/**
 * A link that picks the right element: plain anchors for in-page jumps, the
 * static home page, phone, email and other sites; a Next <Link> otherwise.
 */
export function SiteLink({
  href,
  className,
  children,
  ...data
}: { href: string; className?: string; children: ReactNode } & DataAttributes) {
  const external = href.startsWith('http');
  if (external || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || isHomeLink(href)) {
    return (
      <a href={href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...data}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} {...data}>
      {children}
    </Link>
  );
}

/** Hooks for SiteMotion, e.g. data-img and data-cursor on a row. */
type DataAttributes = { [attribute: `data-${string}`]: string };

/** The thin arrow link used across the site ("Explore the Academy ⟶"). */
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <SiteLink href={href} className="site-link">
      {children} <i aria-hidden="true" />
    </SiteLink>
  );
}

export function GoldButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <SiteLink href={href} className="editorial-btn">
      {children}
    </SiteLink>
  );
}

export type RowItem = {
  name: string;
  text: ReactNode;
  href?: string;
  /** Shown beside the cursor on hover (desktop), and as a thumbnail on phones. */
  image?: string;
  /** The cursor ring's label over a linked row, e.g. "Book". */
  cursor?: string;
};

/**
 * Numbered rows with a large name, as in "Our spaces" on the home page. On a
 * desktop the row's image follows the cursor.
 */
export function Rows({ items }: { items: readonly RowItem[] }) {
  const images = items.flatMap((item) => (item.image ? [item.image] : []));
  return (
    <div data-float-rows>
      <div className="site-rows" data-stagger>
        {items.map((item, i) => {
          const attrs: DataAttributes = {};
          if (item.image) attrs['data-img'] = String(images.indexOf(item.image));
          if (item.href) attrs['data-cursor'] = item.cursor ?? 'View';
          const inner = (
            <>
              <span className="site-row__n">{pad(i + 1)}</span>
              <span className="site-row__name">{item.name}</span>
              <span className="site-row__text">{item.text}</span>
              {item.href ? <span className="site-row__arrow" aria-hidden="true" /> : <span aria-hidden="true" />}
              {item.image ? <img className="site-row__thumb" src={item.image} alt="" loading="lazy" /> : null}
            </>
          );
          return item.href ? (
            <SiteLink key={item.name} href={item.href} className="site-row is-link" {...attrs}>
              {inner}
            </SiteLink>
          ) : (
            <div key={item.name} className="site-row" {...attrs}>
              {inner}
            </div>
          );
        })}
      </div>
      {images.length ? (
        <div className="site-float" aria-hidden="true">
          {images.map((src) => (
            <img key={src} src={src} alt="" loading="lazy" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** A photograph wiped open on scroll, with a caption line beneath. */
export function Figure({
  src,
  alt,
  caption,
  fig,
  ratio = '4 / 5',
  position,
  cursor,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  fig?: string;
  ratio?: string;
  position?: string;
  cursor?: string;
  className?: string;
}) {
  const frame: CSSProperties = { aspectRatio: ratio };
  return (
    <figure className={cx('site-figure', className)}>
      <div className="site-figure__frame" data-reveal="up" style={frame} {...(cursor ? { 'data-cursor': cursor } : {})}>
        <img src={src} alt={alt} loading="lazy" style={position ? { objectPosition: position } : undefined} />
      </div>
      {caption ? (
        <figcaption data-fade>
          <span>{caption}</span>
          {fig ? <span>{fig}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Large counters on a stepped hairline grid, as on the home page. */
export function Stats({ items }: { items: readonly { n: number; unit?: string; label: string }[] }) {
  return (
    <div className="site-stats" data-stagger>
      {items.map((s) => (
        <div key={s.label} className="site-stat">
          <div className="site-stat__n">
            <span data-count={s.n}>{pad(s.n)}</span>
            {s.unit ? <span className="site-stat__u">{s.unit}</span> : null}
          </div>
          <p className="site-stat__l">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Three short labelled facts side by side ("Surface", "Light", "Desk"). */
export function Facts({ items }: { items: readonly { label: string; text: ReactNode }[] }) {
  return (
    <div className="site-facts" data-stagger>
      {items.map((f) => (
        <div key={f.label}>
          <b>{f.label}</b>
          <p>{f.text}</p>
        </div>
      ))}
    </div>
  );
}

/** A labelled pair in a hairline list, e.g. "Access — Monday–Friday…". */
export function FactList({ items }: { items: readonly { label: string; value: ReactNode }[] }) {
  return (
    <dl className="site-dl" data-stagger>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Numbered steps on a rail that fills in gold as they scroll past. */
export function Steps({ items }: { items: readonly { title: string; text: ReactNode }[] }) {
  return (
    <div className="site-steps">
      <span className="site-steps__rail" aria-hidden="true">
        <i data-progress />
      </span>
      <ol>
        {items.map((step, i) => (
          <li key={step.title} className="site-step" data-step data-fade>
            <span className="site-step__n">{pad(i + 1)}</span>
            <div>
              <h3 className="site-step__title">{step.title}</h3>
              <div className="site-step__text">{step.text}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export type FaqItem = { q: string; a: ReactNode };

/** Questions as an accordion, built on <details> so it works without script. */
export function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="site-faqs" data-stagger>
      {items.map((item, i) => (
        <details key={item.q} className="site-faq">
          <summary>
            <span className="site-faq__n">{pad(i + 1)}</span>
            <span className="site-faq__q">{item.q}</span>
            <span className="site-faq__mark" aria-hidden="true" />
          </summary>
          <div className="site-faq__body">
            <div className="site-faq__a">{item.a}</div>
          </div>
        </details>
      ))}
    </div>
  );
}

/** The full-bleed closing banner, as at the foot of the home page. */
export function PageCta({
  lines,
  lede,
  image,
  children,
}: {
  lines: readonly ReactNode[];
  lede?: ReactNode;
  image: string;
  children?: ReactNode;
}) {
  return (
    <section className="site-cta">
      <div className="site-cta__media">
        <img src={image} alt="" loading="lazy" />
      </div>
      <div className="site-cta__veil" aria-hidden="true" />
      <div className="site-cta__body">
        <h2 className="site-display" data-lines>
          <Lines lines={lines} />
        </h2>
        {lede ? (
          <p className="site-lede" data-fade>
            {lede}
          </p>
        ) : null}
        {children ? (
          <div className="site-actions" data-fade>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** A heading column beside the enquiry form, on cream. */
export function EnquirySection({
  id = 'enquire',
  eyebrow,
  lines,
  lede,
  aside,
  subject,
  fields,
}: {
  id?: string;
  eyebrow: string;
  lines: readonly ReactNode[];
  lede?: ReactNode;
  /** Anything under the lede: FAQs, a disclaimer, contact details. */
  aside?: ReactNode;
  subject: string;
  fields: readonly EnquiryField[];
}) {
  return (
    <section id={id} className="site-section site-cream site-lines scroll-mt-20">
      <div className="site-wrap site-enquire">
        <div className="site-enquire__head">
          <p className="site-eyebrow" data-fade>
            {eyebrow}
          </p>
          <Heading lines={lines} className="mt-7" />
          {lede ? (
            <p className="site-lede mt-8 max-w-md" data-fade>
              {lede}
            </p>
          ) : null}
          {aside ? (
            <div className="mt-12" data-fade>
              {aside}
            </div>
          ) : null}
        </div>
        <div className="site-enquire__form" data-fade>
          <EnquiryForm subject={subject} fields={fields} submitLabel="Send on WhatsApp" />
        </div>
      </div>
    </section>
  );
}

export type Clause = { id: string; n: string; title: string; body: ReactNode };

/**
 * Policy text: a sticky list of contents beside numbered clauses, so a long
 * policy can be scanned and jumped through.
 */
export function PolicyBody({ clauses, footer }: { clauses: readonly Clause[]; footer?: ReactNode }) {
  return (
    <section className="site-section site-light site-lines">
      <div className="site-wrap site-policy">
        <nav className="site-policy__toc" aria-label="On this page" data-fade>
          <p className="site-eyebrow">On this page</p>
          <ol>
            {clauses.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>
                  <span>{c.n}</span>
                  {c.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="site-policy__body">
          {clauses.map((c) => (
            <article key={c.id} id={c.id} className="site-clause scroll-mt-24" data-fade>
              <span className="site-clause__n">{c.n}</span>
              <h2 className="site-clause__title">{c.title}</h2>
              <div className="site-clause__text">{c.body}</div>
            </article>
          ))}
          {footer}
        </div>
      </div>
    </section>
  );
}

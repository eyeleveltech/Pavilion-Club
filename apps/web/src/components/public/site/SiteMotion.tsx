'use client';

import { useEffect, useLayoutEffect } from 'react';

import { MOTION_SCRIPTS } from '@/components/public/site/motionScripts';

/**
 * Motion for the club's information pages, in the home page's language:
 * masked line reveals, fades, clip-path image reveals, a ticker that speeds
 * up with the scroll, hover rows with a floating image, Lenis smooth
 * scrolling and the gold cursor. It runs the GSAP build the home page already
 * serves from /assets/js, so nothing is added to the bundle.
 *
 * Markup opts in with data attributes (the .site-* blocks in SitePage):
 *   data-lines     a heading whose .ln > span lines slide up
 *   data-fade      fades up when it enters
 *   data-stagger   its children fade up one after another
 *   data-reveal    an image frame wiped open ("up" or "left")
 *   data-words     a paragraph whose words brighten as it is read
 *   data-count     a number that counts up (data-format="inr" for ₹2,000)
 *   data-progress  a rail that fills while its steps scroll past
 *   data-img       a row that shows image N of the section's .site-float
 *   data-cursor    a label for the cursor ring
 *
 * The CSS hides these until this runs (html.site-motion, set by SitePage), so
 * nothing flashes. With reduced motion nothing is hidden and nothing moves.
 */

// The GSAP files are plain browser globals.
type MotionWindow = Window & Record<string, any>;

let loading: Promise<void> | null = null;

function loadMotion(): Promise<void> {
  const w = window as MotionWindow;
  loading ??= Promise.all(
    MOTION_SCRIPTS.map(([name, src]) =>
      w[name]
        ? Promise.resolve()
        : new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = false; // run in list order: GSAP before its plugins
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`Could not load ${src}`));
            document.head.appendChild(s);
          }),
    ),
  ).then(() => undefined);
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

const pad = (n: number, width: number) => String(n).padStart(width, '0');

type Listen = <K extends keyof HTMLElementEventMap>(
  el: EventTarget,
  type: K,
  fn: (e: HTMLElementEventMap[K]) => void,
) => void;

export function SiteMotion() {
  // Client-side navigations skip SitePage's inline boot script; hide the
  // animated elements before paint here instead.
  useLayoutEffect(() => {
    document.documentElement.classList.add('site-motion');
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.site-root');
    if (!root) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadMotion()
      .then(() => {
        if (!cancelled) cleanup = runMotion(root);
      })
      .catch(() => document.documentElement.classList.add('site-motion-off'));

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}

function runMotion(root: HTMLElement): () => void {
  const w = window as MotionWindow;
  const { gsap, ScrollTrigger, SplitText, Lenis } = w;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.config({ nullTargetWarn: false });
  w.__siteMotion = true;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // If the scripts arrived after SitePage's fallback had already shown the
  // content, hiding it again to animate it in would flash: skip entrances.
  const late = document.documentElement.classList.contains('site-motion-off');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches && innerWidth > 1024;
  const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) =>
    Array.from(scope.querySelectorAll<T>(sel));

  const disposers: (() => void)[] = [];
  const on: Listen = (el, type, fn) => {
    el.addEventListener(type, fn as EventListener);
    disposers.push(() => el.removeEventListener(type, fn as EventListener));
  };

  /* ---------- smooth scroll ---------- */
  let lenis: any = null;
  if (!reduce && Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    w.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    disposers.push(() => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      w.lenis = null;
    });
  }

  // In-page links glide past the sticky header.
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    on(a, 'click', (e) => {
      const id = a.getAttribute('href') ?? '';
      const target = id.length > 1 ? document.querySelector(id) : null;
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -72, duration: 1.5, easing: (x: number) => 1 - Math.pow(1 - x, 4) });
      else target.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', id);
    }),
  );

  const splits: { revert(): void }[] = [];

  const ctx = gsap.context(() => {
    if (reduce) return;

    /* ---------- initial states (the CSS has kept these hidden) ---------- */
    if (!late) {
      gsap.set($$('[data-lines] .ln > span'), { yPercent: 112, visibility: 'inherit' });
      gsap.set($$('[data-fade]'), { autoAlpha: 0, y: 26 });
      gsap.set($$('[data-stagger] > *'), { autoAlpha: 0, y: 30 });
      $$('[data-reveal]').forEach((el) =>
        gsap.set(el, {
          clipPath: el.dataset.reveal === 'left' ? 'inset(0% 100% 0% 0%)' : 'inset(100% 0% 0% 0%)',
          visibility: 'inherit',
        }),
      );
      gsap.set($$('[data-reveal] img'), { scale: 1.22 });
    }

    /* ---------- hero: entrance, parallax, drift ---------- */
    const hero = root.querySelector<HTMLElement>('.site-hero');
    if (hero) {
      const img = hero.querySelector<HTMLElement>('.site-hero__media img');
      if (!late) {
        const intro = gsap.timeline({ delay: 0.05 });
        if (img) intro.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 2.4, ease: 'power3.out' }, 0);
        intro
          .to($$('.ln > span', hero), { yPercent: 0, duration: 1.4, ease: 'power4.out', stagger: 0.12 }, 0.15)
          .to($$('[data-fade]', hero), { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 }, 0.55);
      }

      const media = hero.querySelector('.site-hero__media');
      if (media)
        gsap.to(media, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(hero.querySelectorAll('.site-hero__inner, .site-hero__meta'), {
        yPercent: -8,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: '40% top', end: 'bottom top', scrub: true },
      });
      if (img && fine) {
        const hx = gsap.quickTo(img, 'x', { duration: 1.4, ease: 'power3' });
        const hy = gsap.quickTo(img, 'y', { duration: 1.4, ease: 'power3' });
        on(hero, 'mousemove', (e) => {
          hx((e.clientX / innerWidth - 0.5) * -22);
          hy((e.clientY / innerHeight - 0.5) * -14);
        });
        on(hero, 'mouseleave', () => {
          hx(0);
          hy(0);
        });
      }
    }

    /* ---------- ticker, sped up by scroll velocity ---------- */
    $$('.site-ticker__track').forEach((track) => {
      const tick = gsap.to(track, { xPercent: -50, ease: 'none', duration: 42, repeat: -1 });
      let target = 1;
      ScrollTrigger.create({
        onUpdate: (s: any) => {
          target = 1 + Math.min(5, Math.abs(s.getVelocity()) / 350);
        },
      });
      const ease = () => {
        tick.timeScale(gsap.utils.interpolate(tick.timeScale(), target, 0.06));
        target += (1 - target) * 0.04;
      };
      gsap.ticker.add(ease);
      disposers.push(() => gsap.ticker.remove(ease));
    });

    /* ---------- generic reveals ---------- */
    if (!late) {
      const outsideHero = (el: Element) => !el.closest('.site-hero');
      $$('[data-lines]')
        .filter(outsideHero)
        .forEach((el) =>
          gsap.to($$('.ln > span', el), {
            yPercent: 0,
            duration: 1.35,
            ease: 'power4.out',
            stagger: 0.11,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }),
        );
      $$('[data-fade]')
        .filter(outsideHero)
        .forEach((el) =>
          gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.15, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
        );
      $$('[data-stagger]').forEach((el) =>
        gsap.to(Array.from(el.children), {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        }),
      );
      $$('[data-reveal]').forEach((el) => {
        const st = { trigger: el, start: 'top 84%', once: true };
        gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power4.inOut', scrollTrigger: st });
        gsap.to(el.querySelector('img'), { scale: 1, duration: 2.2, ease: 'power3.out', scrollTrigger: st });
      });
    }

    // Words brighten as the paragraph is read.
    $$('[data-words]').forEach((el) =>
      splits.push(
        SplitText.create(el, {
          type: 'words',
          autoSplit: true,
          onSplit: (s: any) =>
            gsap.fromTo(
              s.words,
              { opacity: 0.16 },
              { opacity: 1, stagger: 0.035, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: 0.4 } },
            ),
        }),
      ),
    );

    // Numbers count up; the markup holds the final value for no-JS and reduced motion.
    $$('[data-count]').forEach((el) => {
      if (late) return;
      const end = Number(el.dataset.count);
      const inr = el.dataset.format === 'inr';
      const width = el.textContent?.trim().length ?? 2;
      const show = (v: number) => {
        el.textContent = inr ? Math.round(v).toLocaleString('en-IN') : pad(Math.round(v), width);
      };
      const o = { v: 0 };
      show(0);
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => show(o.v) }),
      });
    });

    // Step rails fill as their steps pass the middle of the screen.
    $$('[data-progress]').forEach((bar) => {
      const track = bar.closest('.site-steps') ?? bar.parentElement;
      gsap.fromTo(bar, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: track, start: 'top 65%', end: 'bottom 65%', scrub: 0.6 } });
    });
    $$('[data-step]').forEach((step) => ScrollTrigger.create({ trigger: step, start: 'top 65%', toggleClass: 'is-on' }));

    /* ---------- rows with a floating image ---------- */
    if (fine) {
      $$('[data-float-rows]').forEach((section) => {
        const float = section.querySelector<HTMLElement>('.site-float');
        if (!float) return;
        const imgs = $$<HTMLImageElement>('img', float);
        gsap.set(float, { xPercent: -50, yPercent: -50, scale: 0.9 });
        const fx = gsap.quickTo(float, 'x', { duration: 0.55, ease: 'power3' });
        const fy = gsap.quickTo(float, 'y', { duration: 0.55, ease: 'power3' });
        const hide = () => gsap.to(float, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
        $$('[data-img]', section).forEach((row) => {
          on(row, 'mouseenter', () => {
            imgs.forEach((im, j) => im.classList.toggle('is-on', j === Number(row.dataset.img)));
            gsap.to(float, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
          });
          on(row, 'mouseleave', hide);
        });
        on(section, 'mousemove', (e) => {
          fx(e.clientX);
          fy(e.clientY);
        });
        on(section, 'mouseleave', hide);
      });
    }

    /* ---------- closing banner ---------- */
    $$('.site-cta').forEach((cta) =>
      gsap.fromTo(cta.querySelector('.site-cta__media'), { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: cta, start: 'top bottom', end: 'bottom top', scrub: true } }),
    );

    /* ---------- footer wordmark rises into place ---------- */
    const ghost = root.querySelector('.footer__ghost');
    if (ghost)
      // y: 0 drops the pixel offset GSAP reads from the CSS translateY.
      gsap.fromTo(ghost, { y: 0, yPercent: 60 }, { y: 0, yPercent: 24, ease: 'none', scrollTrigger: { trigger: ghost.closest('.footer'), start: 'top bottom', end: 'bottom bottom', scrub: true } });

    /* ---------- FAQs open and close smoothly ---------- */
    $$<HTMLDetailsElement>('details.site-faq').forEach((d) => {
      const summary = d.querySelector<HTMLElement>('summary');
      const body = d.querySelector<HTMLElement>('.site-faq__body');
      if (!summary || !body) return;
      on(summary, 'click', (e) => {
        e.preventDefault();
        if (d.open) {
          d.classList.add('is-closing');
          gsap.to(body, {
            height: 0,
            autoAlpha: 0,
            duration: 0.45,
            ease: 'power3.inOut',
            onComplete: () => {
              d.open = false;
              d.classList.remove('is-closing');
              gsap.set(body, { clearProps: 'height,opacity,visibility' });
              ScrollTrigger.refresh();
            },
          });
        } else {
          d.open = true;
          d.classList.remove('is-closing');
          gsap.fromTo(
            body,
            { height: 0, autoAlpha: 0 },
            { height: 'auto', autoAlpha: 1, duration: 0.6, ease: 'power3.out', clearProps: 'height,opacity,visibility', onComplete: () => ScrollTrigger.refresh() },
          );
        }
      });
    });

    /* ---------- magnetic buttons ---------- */
    if (fine) {
      $$('.editorial-btn').forEach((btn) => {
        const bx = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
        const by = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
        on(btn, 'mousemove', (e) => {
          const r = btn.getBoundingClientRect();
          bx((e.clientX - (r.left + r.width / 2)) * 0.3);
          by((e.clientY - (r.top + r.height / 2)) * 0.3);
        });
        on(btn, 'mouseleave', () => {
          bx(0);
          by(0);
        });
      });
    }
  }, root);

  /* ---------- the gold cursor ---------- */
  if (fine && !reduce) disposers.push(mountCursor(gsap, on));

  // Fonts change line lengths, and so every trigger position.
  void document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => {
    disposers.splice(0).forEach((dispose) => dispose());
    splits.splice(0).forEach((s) => s.revert());
    ctx.revert();
    w.__siteMotion = false;
  };
}

function mountCursor(gsap: any, on: Listen): () => void {
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'site-cursor';
  ring.className = 'site-cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(dot, ring);
  document.body.classList.add('has-cursor');

  gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: innerWidth / 2, y: innerHeight / 2 });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.1 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
  // Hidden until the mouse moves, and over form fields, where the text
  // cursor shows instead.
  let shown = false;

  on(window, 'mousemove', (e) => {
    dx(e.clientX);
    dy(e.clientY);
    rx(e.clientX);
    ry(e.clientY);
    const el = e.target instanceof Element ? e.target : null;
    const label = el?.closest<HTMLElement>('[data-cursor]')?.dataset.cursor ?? '';
    if (ring.textContent !== label) ring.textContent = label;
    ring.classList.toggle('is-label', Boolean(label));
    ring.classList.toggle('is-link', !label && Boolean(el?.closest('a, button, summary, label')));
    const inModal = Boolean(el?.closest('[role="dialog"], .studio-modal-scroll'));
    const isFormInput = Boolean(el?.closest('input, textarea, select'));
    const show = !inModal && !isFormInput;
    if (show !== shown) {
      shown = show;
      gsap.to([dot, ring], { opacity: show ? 1 : 0, duration: 0.25, overwrite: 'auto' });
    }
  });
  on(document.documentElement, 'mouseleave', () => {
    shown = false;
    gsap.to([dot, ring], { opacity: 0, duration: 0.3, overwrite: 'auto' });
  });

  return () => {
    dot.remove();
    ring.remove();
    document.body.classList.remove('has-cursor');
  };
}

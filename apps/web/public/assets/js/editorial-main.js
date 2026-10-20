
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesk = () => innerWidth > 900;

  /* ---------- mobile menu ---------- */
  (function menu() {
    const menu = $('#menu'), btn = $('.nav__menu'); let open = false;
    const toggle = force => {
      open = typeof force === 'boolean' ? force : !open;
      btn.textContent = open ? 'Close' : 'Menu'; btn.setAttribute('aria-expanded', open);
      if (open) { gsap.set(menu, { visibility: 'visible' }); gsap.to(menu, { clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'power4.inOut' }); gsap.fromTo($$('a', menu), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .8, ease: 'power3.out', delay: .3 }); window.lenis && lenis.stop(); }
      else { gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: .7, ease: 'power4.inOut', onComplete: () => gsap.set(menu, { visibility: 'hidden' }) }); window.lenis && lenis.start(); }
    };
    btn.addEventListener('click', () => toggle());
    $$('a', menu).forEach(a => a.addEventListener('click', () => toggle(false)));
  
  window.__pavilionDestroy = () => {
    try {
      if (window.lenis?.destroy) { window.lenis.destroy(); window.lenis = null; }
      if (window.ScrollTrigger) {
        window.ScrollTrigger.getAll().forEach(t => {
          try { if (t && typeof t.kill === 'function') t.kill(true); } catch (_) {}
        });
        if (typeof window.ScrollTrigger.clearMatchMedia === 'function') {
          window.ScrollTrigger.clearMatchMedia();
        }
      }
      document.body.classList.remove('has-cursor');
    } catch (_) {}
  };

})();

  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.config({ nullTargetWarn: false });

  /* ---------- smooth scroll ---------- */
  if (!reduce && window.Lenis) {
    window.lenis = new Lenis({ lerp: .085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault();
    if (window.lenis) lenis.scrollTo(t, { offset: 0, duration: 1.6, easing: x => 1 - Math.pow(1 - x, 4) }); else t.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- nav state ---------- */
  ScrollTrigger.create({ start: 60, end: 'max', toggleClass: { targets: '#nav', className: 'is-scrolled' } });

  /* ---------- initial states ---------- */
  gsap.set('[data-lines] .ln > span', { yPercent: 112 });
  gsap.set('[data-fade]', { autoAlpha: 0, y: 26 });
  $$('[data-reveal]').forEach(el => gsap.set(el, { clipPath: el.dataset.reveal === 'left' ? 'inset(0% 100% 0% 0%)' : 'inset(100% 0% 0% 0%)' }));
  $$('[data-reveal] img').forEach(img => gsap.set(img, { scale: 1.22 }));

  document.fonts.ready.then(init);

  function init() {
    /* ---------- loader → hero ---------- */
    const heroIntro = gsap.timeline({ paused: true })
      .to('.hero__media img', { scale: 1, duration: 2.6, ease: 'power3.out' }, 0)
      .to('.hero__title .ln > span', { yPercent: 0, duration: 1.5, ease: 'power4.out', stagger: .14 }, .3)
      .from(['.hero__meta span', '.hero__aside > *', '.hero__side', '#nav > *'], { y: 22, autoAlpha: 0, duration: 1.1, stagger: .07, ease: 'power3.out' }, .9);
    gsap.set('.hero__media img', { scale: 1.18 });

    if (reduce) {
      gsap.set('.loader', { display: 'none' });
      gsap.set(['[data-lines] .ln > span', '[data-fade]', '.hero__media img'], { clearProps: 'all' });
      gsap.set('[data-reveal]', { clipPath: 'inset(0% 0% 0% 0%)' }); gsap.set('[data-reveal] img', { scale: 1 });
    } else {
      const paths = $$('.loader__mono rect, .loader__mono path');
      paths.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
      const n = { v: 0 }, cEl = $('.loader__count');
      gsap.timeline()
        .to(paths, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: .12 }, 0)
        .to(n, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: () => cEl.textContent = String(Math.round(n.v)).padStart(3, '0') }, 0)
        .to('.loader__line', { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0)
        .to('.loader', { yPercent: -100, duration: 1.15, ease: 'power4.inOut' }, '+=.2')
        .set('.loader', { display: 'none' })
        .add(() => {
          heroIntro.play();
          if (window.location.hash) {
            const hTarget = $(window.location.hash);
            if (hTarget) {
              setTimeout(() => {
                if (window.lenis) lenis.scrollTo(hTarget, { offset: 0, duration: 1.6, easing: x => 1 - Math.pow(1 - x, 4) });
                else hTarget.scrollIntoView({ behavior: 'smooth' });
              }, 400);
            }
          }
        }, '-=1.05');
    }

    /* ---------- hero scroll parallax + mouse drift ---------- */
    gsap.to('.hero__media', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__inner', { yPercent: -10, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '20% top', end: '80% top', scrub: true } });
    const heroEl = $('.hero'), heroImg = $('.hero__media img');
    if (heroEl && heroImg) {
      const hx = gsap.quickTo(heroImg, 'x', { duration: 1.4, ease: 'power3' }), hy = gsap.quickTo(heroImg, 'y', { duration: 1.4, ease: 'power3' });
      heroEl.addEventListener('mousemove', e => { hx((e.clientX / innerWidth - .5) * -22); hy((e.clientY / innerHeight - .5) * -14); });
      heroEl.addEventListener('mouseleave', () => { hx(0); hy(0); });
    }

    /* ---------- ticker, sped up by scroll velocity ---------- */
    const tick = gsap.to('.ticker__track', { xPercent: -50, ease: 'none', duration: 42, repeat: -1 });
    if (!reduce) {
      let target = 1;
      ScrollTrigger.create({ onUpdate: s => { target = 1 + Math.min(5, Math.abs(s.getVelocity()) / 350); } });
      gsap.ticker.add(() => { tick.timeScale(gsap.utils.interpolate(tick.timeScale(), target, .06)); target += (1 - target) * .04; });
    }

    /* ---------- generic reveals ---------- */
    $$('[data-lines]').forEach(el => {
      if (el.closest('.hero')) return;
      gsap.to($$('.ln > span', el), { yPercent: 0, duration: 1.4, ease: 'power4.out', stagger: .12, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    $$('[data-fade]').forEach(el => gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    $$('[data-reveal]').forEach(el => {
      const img = $('img', el);
      gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power4.inOut', scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
      gsap.to(img, { scale: 1, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
    });
    $$('[data-split]').forEach(el => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: s => gsap.from(s.lines, { yPercent: 110, duration: 1.3, ease: 'power4.out', stagger: .09, scrollTrigger: { trigger: el, start: 'top 85%', once: true } }) });
    });
    $$('[data-parallax]').forEach(el => { const a = +el.dataset.parallax; gsap.fromTo(el, { y: a }, { y: -a, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }); });

    /* ---------- manifesto: words brighten as you read ---------- */
    const copy = $('.manifesto__copy');
    const words = SplitText.create(copy, { type: 'words', wordsClass: 'w', autoSplit: true, onSplit: s => gsap.fromTo(s.words, { opacity: .14 }, { opacity: 1, stagger: .035, ease: 'none', scrollTrigger: { trigger: copy, start: 'top 78%', end: 'bottom 48%', scrub: .4 } }) });

    /* ---------- responsive: chapters + horizontal day ---------- */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      // chapters — pinned, curtain reveals
      const chapters = $$('.chapter'), ghost = $('.chapters__ghost'), bars = $$('.chapters__progress i'), chaptersEl = $('.chapters');
      if (!chapters.length || !chaptersEl) return;
      chapters.slice(1).forEach(c => { gsap.set($('.chapter__img', c), { clipPath: 'inset(100% 0% 0% 0%)' }); gsap.set($('.chapter__body', c), { autoAlpha: 0 }); });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.chapters', start: 'top top', end: '+=240%', pin: true, scrub: .7, anticipatePin: 1,
          onUpdate: s => {
            const p = s.progress * chapters.length; const i = Math.min(chapters.length - 1, Math.floor(p));
            ghost.textContent = chapters[i].dataset.n;
            bars.forEach((b, j) => b.style.setProperty('--p', gsap.utils.clamp(0, 1, p - j)));
          }
        }
      });
      chapters.forEach((ch, i) => {
        if (!i) { tl.to({}, { duration: .5 }); return; }
        const prev = chapters[i - 1], at = `c${i}`;
        tl.addLabel(at)
          .to($('.chapter__body', prev), { autoAlpha: 0, y: -34, duration: .6, ease: 'power2.in' }, at)
          .to($('.chapter__img img', prev), { scale: 1.12, duration: 1.5, ease: 'none' }, at)
          .to($('.chapter__img', ch), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power2.inOut' }, at)
          .fromTo($('.chapter__body', ch), { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: .7, ease: 'power2.out' }, `${at}+=.7`)
          .to({}, { duration: .5 });
      });

      // a day, court-side — horizontal
      const track = $('.day__track'), bar = $('.day__bar i'), dayEl = $('.day');
      if (!track || !dayEl) return;
      const dist = () => track.scrollWidth - innerWidth;
      const hTween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.day', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: s => gsap.set(bar, { scaleX: s.progress }) }
      });
      $$('.stop .frame img').forEach(img => gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: img.closest('.stop'), containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } }));
      $$('.stop').forEach(st => gsap.from($('.stop__time', st), { xPercent: 20, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: st, containerAnimation: hTween, start: 'left 85%', toggleActions: 'play none none reverse' } }));

      // facilities — floating image follows the cursor
      const fl = $('.float-img');
      if (fl) {
        const imgs = $$('img', fl);
        gsap.set(fl, { xPercent: -50, yPercent: -50, scale: .9 });
        const fx = gsap.quickTo(fl, 'x', { duration: .55, ease: 'power3' }), fy = gsap.quickTo(fl, 'y', { duration: .55, ease: 'power3' });
        const hideFloat = () => gsap.to(fl, { autoAlpha: 0, scale: .9, duration: .3, ease: 'power3.out', overwrite: 'auto' });
        window.__pavilionHideFloat = hideFloat;

        $$('.row').forEach(row => {
          row.addEventListener('mouseenter', () => {
            imgs.forEach((im, j) => im.classList.toggle('is-on', j === +row.dataset.img));
            gsap.to(fl, { autoAlpha: 1, scale: 1, duration: .4, ease: 'power3.out', overwrite: 'auto' });
          });
          row.addEventListener('mouseleave', hideFloat);
        });

        const rowsEl = $('.rows');
        if (rowsEl) {
          rowsEl.addEventListener('mousemove', e => { fx(e.clientX); fy(e.clientY); });
          rowsEl.addEventListener('mouseleave', hideFloat);
        }
        const facEl = $('.facilities');
        if (facEl) {
          facEl.addEventListener('mouseleave', hideFloat);
        }
      }
      return () => {};
    });
    mm.add('(max-width: 900px)', () => {
      $$('.chapter__img').forEach(el => gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' }));
      $$('.chapter__img').forEach(el => gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } }));
      $$('.chapter__body').forEach(el => gsap.from(el, { y: 26, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
      $$('.stop').forEach(el => gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    });

    /* ---------- stats counters ---------- */
    $$('[data-count]').forEach(el => {
      const end = +el.dataset.count, o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => el.textContent = String(Math.round(o.v)).padStart(2, '0') }) });
    });

    /* ---------- venue + cta media motion ---------- */
    gsap.fromTo('.venue__media img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.venue', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.cta__media', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.footer__ghost', { yPercent: 60 }, { yPercent: 26, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

    /* ---------- magnetic buttons + cursor (luxury animated cursor) ---------- */
    $$('.magnetic').forEach(btn => {
      const bx = gsap.quickTo(btn, 'x', { duration: .6, ease: 'power3' }), by = gsap.quickTo(btn, 'y', { duration: .6, ease: 'power3' });
      btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); bx((e.clientX - (r.left + r.width / 2)) * .32); by((e.clientY - (r.top + r.height / 2)) * .32); });
      btn.addEventListener('mouseleave', () => { bx(0); by(0); });
    });

    const dot = $('.cursor'), ring = $('.cursor-ring');
    if (dot && ring) {
      document.body.classList.add('has-cursor');
      gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: innerWidth / 2, y: innerHeight / 2 });
      const dx = gsap.quickTo(dot, 'x', { duration: .1 }), dy = gsap.quickTo(dot, 'y', { duration: .1 });
      const rx = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' });
      let seen = false;
      let lastX = innerWidth / 2;
      let lastY = innerHeight / 2;

      // Real-time hover evaluator: checks element directly at (x, y)
      const checkHoverAt = (x, y) => {
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
          if (ring.classList.contains('is-hover')) {
            ring.classList.remove('is-hover');
            ring.textContent = '';
          }
          ring.classList.remove('is-link');
          return;
        }

        const el = document.elementFromPoint(x, y);
        const hoverEl = el && el.closest ? el.closest('[data-cursor]') : null;

        if (hoverEl && hoverEl.dataset.cursor) {
          if (!ring.classList.contains('is-hover') || ring.textContent !== hoverEl.dataset.cursor) {
            ring.classList.add('is-hover');
            ring.textContent = hoverEl.dataset.cursor;
          }
        } else {
          if (ring.classList.contains('is-hover')) {
            ring.classList.remove('is-hover');
            ring.textContent = '';
          }
        }

        const linkEl = el && el.closest ? el.closest('a, button, .magnetic') : null;
        if (linkEl && !hoverEl) {
          ring.classList.add('is-link');
        } else {
          ring.classList.remove('is-link');
        }

        // Auto-hide floating image if cursor moves or scrolls away from .row
        if (window.__pavilionHideFloat) {
          if (!el || !el.closest('.row')) {
            window.__pavilionHideFloat();
          }
        }
      };

      const onMouseMove = e => {
        lastX = e.clientX;
        lastY = e.clientY;
        if (!seen) {
          seen = true;
          gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
          gsap.to([dot, ring], { opacity: 1, duration: .3, overwrite: 'auto' });
          document.body.classList.add('has-cursor');
        }
        dx(e.clientX); dy(e.clientY);
        rx(e.clientX); ry(e.clientY);
        checkHoverAt(e.clientX, e.clientY);
      };

      // Real-time scroll handler: immediately updates hover state while scrolling
      const onScrollUpdate = () => {
        if (seen) {
          checkHoverAt(lastX, lastY);
        }
      };

      const onMouseLeave = () => {
        gsap.to([dot, ring], { opacity: 0, duration: .2, overwrite: 'auto' });
        ring.classList.remove('is-hover', 'is-link');
        ring.textContent = '';
        if (window.__pavilionHideFloat) window.__pavilionHideFloat();
        seen = false;
      };

      const onMouseEnter = e => {
        seen = true;
        lastX = e.clientX;
        lastY = e.clientY;
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        gsap.to([dot, ring], { opacity: 1, duration: .2, overwrite: 'auto' });
        document.body.classList.add('has-cursor');
        checkHoverAt(e.clientX, e.clientY);
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('scroll', onScrollUpdate, { passive: true });
      document.addEventListener('mouseleave', onMouseLeave);
      document.addEventListener('mouseenter', onMouseEnter);

      // Connect to Lenis scroll if active
      if (window.lenis) {
        window.lenis.on('scroll', onScrollUpdate);
      }

      // Register clean SPA destroyer
      window.__pavilionDestroy = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('scroll', onScrollUpdate);
        document.removeEventListener('mouseleave', onMouseLeave);
        document.removeEventListener('mouseenter', onMouseEnter);
        if (window.lenis) {
          try { window.lenis.off('scroll', onScrollUpdate); } catch (_) {}
          try { window.lenis.destroy(); } catch (_) {}
          window.lenis = null;
        }
        document.body.classList.remove('has-cursor');
        if (window.ScrollTrigger?.getAll) {
          try { window.ScrollTrigger.getAll().forEach(t => t.kill()); } catch (_) {}
        }
      };
    }

    if (document.readyState === 'complete') ScrollTrigger.refresh(); else addEventListener('load', () => ScrollTrigger.refresh());
  }
})();

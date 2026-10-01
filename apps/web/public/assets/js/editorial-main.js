
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesk = () => innerWidth > 900;

  /* ---------- booking widget (design demo; real availability comes from the server) ---------- */
  (function booking() {
    const daysEl = $('#bw-days'), courtsEl = $('#bw-courts'), gridEl = $('#bw-grid');
    if (!daysEl || !gridEl) return;
    const sumEl = $('#bw-summary'), priceEl = $('#bw-price'), goEl = $('#bw-go'), monthEl = $('#bw-month');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return d; });
    const courts = ['Court 1', 'Court 2', 'Court 3'];
    const state = { day: 0, court: 1, hours: new Set() };
    const fmtW = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
    const fmtM = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
    const fmtD = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const pad = n => String(n).padStart(2, '0');
    const weekend = d => d.getDay() === 0 || d.getDay() === 6;
    const rate = (d, h) => weekend(d) || h >= 17 ? 120000 : 100000;            // paise, illustrative
    const rupees = p => '₹' + (p / 100).toLocaleString('en-IN');
    const taken = (di, ci, h) => ((di * 31 + ci * 7 + h * 13) % 5) === 0;        // deterministic demo pattern
    monthEl.textContent = fmtM.format(days[0]);

    daysEl.innerHTML = days.map((d, i) => `<button class="bw__day${i === state.day ? ' is-on' : ''}" role="tab" aria-selected="${i === state.day}" data-i="${i}"><small>${i === 0 ? 'Today' : fmtW.format(d)}</small><b>${pad(d.getDate())}</b></button>`).join('');
    courtsEl.innerHTML = courts.map((c, i) => `<button class="bw__court${i === state.court ? ' is-on' : ''}" role="tab" aria-selected="${i === state.court}" data-i="${i}">${c}</button>`).join('');

    function grid() {
      const d = days[state.day]; const last = weekend(d) ? 23 : 22; const now = new Date();
      const cells = [];
      for (let h = 6; h <= last; h++) {
        const past = state.day === 0 && h <= now.getHours();
        const isTaken = past || taken(state.day, state.court, h);
        const on = state.hours.has(h);
        cells.push(`<button class="slot${isTaken ? ' is-taken' : ''}${on ? ' is-on' : ''}" data-h="${h}" ${isTaken ? 'disabled aria-disabled="true"' : ''} aria-pressed="${on}"><b>${pad(h)}:00</b><span>${isTaken ? (past ? 'Past' : 'Booked') : rupees(rate(d, h))}</span></button>`);
      }
      gridEl.innerHTML = cells.join('');
      fill(); summary();
    }
    function fill() {                                                        // blank cells so the hairline grid stays closed
      $$('.slot--empty', gridEl).forEach(e => e.remove());
      const cols = getComputedStyle(gridEl).gridTemplateColumns.split(' ').length;
      const n = (cols - gridEl.children.length % cols) % cols;
      for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'slot slot--empty'; gridEl.appendChild(d); }
    }
    addEventListener('resize', fill);
    function summary() {
      const d = days[state.day];
      if (!state.hours.size) { sumEl.textContent = 'Pick an hour to begin'; priceEl.textContent = 'From ₹1,000'; goEl.setAttribute('aria-disabled', 'true'); return; }
      const hs = [...state.hours].sort((a, b) => a - b);
      const total = hs.reduce((s, h) => s + rate(d, h), 0);
      sumEl.textContent = `${courts[state.court]} · ${fmtD.format(d)} · ${pad(hs[0])}:00–${pad((hs[hs.length - 1] + 1) % 24)}:00`;
      priceEl.textContent = rupees(total); goEl.removeAttribute('aria-disabled');
    }
    daysEl.addEventListener('click', e => { const b = e.target.closest('.bw__day'); if (!b) return; state.day = +b.dataset.i; state.hours.clear(); $$('.bw__day', daysEl).forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); }); grid(); });
    courtsEl.addEventListener('click', e => { const b = e.target.closest('.bw__court'); if (!b) return; state.court = +b.dataset.i; state.hours.clear(); $$('.bw__court', courtsEl).forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); }); grid(); });
    gridEl.addEventListener('click', e => { const b = e.target.closest('.slot'); if (!b || b.disabled) return; const h = +b.dataset.h; state.hours.has(h) ? state.hours.delete(h) : state.hours.add(h); b.classList.toggle('is-on'); b.setAttribute('aria-pressed', b.classList.contains('is-on')); summary(); });
    goEl.addEventListener('click', e => { if (goEl.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
    grid();
  })();

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
        .add(() => heroIntro.play(), '-=1.05');
    }

    /* ---------- hero scroll parallax + mouse drift ---------- */
    gsap.to('.hero__media', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__inner', { yPercent: -10, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '20% top', end: '80% top', scrub: true } });
    if (fine && !reduce) {
      const hx = gsap.quickTo('.hero__media img', 'x', { duration: 1.4, ease: 'power3' }), hy = gsap.quickTo('.hero__media img', 'y', { duration: 1.4, ease: 'power3' });
      $('.hero').addEventListener('mousemove', e => { hx((e.clientX / innerWidth - .5) * -22); hy((e.clientY / innerHeight - .5) * -14); });
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
      const chapters = $$('.chapter'), ghost = $('.chapters__ghost'), bars = $$('.chapters__progress i');
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
      const track = $('.day__track'), bar = $('.day__bar i');
      const dist = () => track.scrollWidth - innerWidth;
      const hTween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.day', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: s => gsap.set(bar, { scaleX: s.progress }) }
      });
      $$('.stop .frame img').forEach(img => gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: img.closest('.stop'), containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } }));
      $$('.stop').forEach(st => gsap.from($('.stop__time', st), { xPercent: 20, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: st, containerAnimation: hTween, start: 'left 85%', toggleActions: 'play none none reverse' } }));

      // facilities — floating image follows the cursor
      if (fine) {
        const fl = $('.float-img'), imgs = $$('img', fl);
        gsap.set(fl, { xPercent: -50, yPercent: -50, scale: .9 });
        const fx = gsap.quickTo(fl, 'x', { duration: .55, ease: 'power3' }), fy = gsap.quickTo(fl, 'y', { duration: .55, ease: 'power3' });
        $$('.row').forEach(row => {
          row.addEventListener('mouseenter', () => { imgs.forEach((im, j) => im.classList.toggle('is-on', j === +row.dataset.img)); gsap.to(fl, { autoAlpha: 1, scale: 1, duration: .55, ease: 'power3.out' }); });
          row.addEventListener('mouseleave', () => gsap.to(fl, { autoAlpha: 0, scale: .9, duration: .4, ease: 'power3.out' }));
        });
        $('.rows').addEventListener('mousemove', e => { fx(e.clientX); fy(e.clientY); });
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

    /* ---------- magnetic buttons + cursor ---------- */
    if (window.__pavilionCursor && typeof window.__pavilionCursor.destroy === 'function') {
      try { window.__pavilionCursor.destroy(); } catch (_) {}
    }

    const dot = $('.cursor');
    const ring = $('.cursor-ring');

    if (dot && ring && !reduce) {
      $$('.magnetic').forEach(btn => {
        const bx = gsap.quickTo(btn, 'x', { duration: .6, ease: 'power3' }), by = gsap.quickTo(btn, 'y', { duration: .6, ease: 'power3' });
        btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); bx((e.clientX - (r.left + r.width / 2)) * .32); by((e.clientY - (r.top + r.height / 2)) * .32); });
        btn.addEventListener('mouseleave', () => { bx(0); by(0); });
      });

      gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
      const dx = gsap.quickTo(dot, 'x', { duration: .08, ease: 'none' }), dy = gsap.quickTo(dot, 'y', { duration: .08, ease: 'none' });
      const rx = gsap.quickTo(ring, 'x', { duration: .35, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .35, ease: 'power3' });

      let isVisible = false;

      const showCursor = (clientX, clientY) => {
        document.body.classList.add('has-cursor');
        dot.style.display = 'block';
        ring.style.display = 'flex';
        if (!isVisible) {
          isVisible = true;
          gsap.set([dot, ring], { x: clientX, y: clientY });
          gsap.to([dot, ring], { opacity: 1, duration: .2, overwrite: 'auto' });
        }
        dx(clientX); dy(clientY);
        rx(clientX); ry(clientY);
      };

      const hideCursor = () => {
        isVisible = false;
        gsap.to([dot, ring], { opacity: 0, duration: .25, overwrite: 'auto' });
      };

      const onMouseMove = (e) => {
        showCursor(e.clientX, e.clientY);
      };

      const onMouseLeave = () => {
        hideCursor();
      };

      const onMouseEnter = (e) => {
        showCursor(e.clientX, e.clientY);
      };

      const onTouchStart = () => {
        document.body.classList.remove('has-cursor');
        hideCursor();
      };

      const onMouseOver = (e) => {
        const target = e.target.closest('a, button, [data-cursor], .magnetic, .row');
        if (!target) return;
        if (target.dataset && target.dataset.cursor) {
          ring.classList.add('is-hover');
          ring.textContent = target.dataset.cursor;
        } else {
          ring.classList.add('is-link');
        }
      };

      const onMouseOut = (e) => {
        const target = e.target.closest('a, button, [data-cursor], .magnetic, .row');
        if (!target) return;
        ring.classList.remove('is-hover', 'is-link');
        ring.textContent = '';
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      document.addEventListener('mouseleave', onMouseLeave);
      document.addEventListener('mouseenter', onMouseEnter);
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      document.addEventListener('mouseover', onMouseOver, { passive: true });
      document.addEventListener('mouseout', onMouseOut, { passive: true });

      window.__pavilionCursor = {
        destroy: () => {
          window.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseleave', onMouseLeave);
          document.removeEventListener('mouseenter', onMouseEnter);
          window.removeEventListener('touchstart', onTouchStart);
          document.removeEventListener('mouseover', onMouseOver);
          document.removeEventListener('mouseout', onMouseOut);
          document.body.classList.remove('has-cursor');
          window.__pavilionCursor = null;
        }
      };
    }

    if (document.readyState === 'complete') ScrollTrigger.refresh(); else addEventListener('load', () => ScrollTrigger.refresh());
  }
})();

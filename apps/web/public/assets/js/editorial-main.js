(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesk = () => innerWidth > 900;

  // Cleanup any previous instance
  if (window.__pavilionDestroy) {
    try { window.__pavilionDestroy(); } catch(e) {}
  }

  /* ---------- booking widget (design demo; real availability comes from the server) ---------- */
  (function booking() {
    const daysEl = $('#bw-days'), courtsEl = $('#bw-courts'), gridEl = $('#bw-grid');
    if (!daysEl || !gridEl) return;
    const sumEl = $('#bw-summary'), priceEl = $('#bw-price'), goEl = $('#bw-go'), monthEl = $('#bw-month');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return d; });
    const courts = ['Court 1 · Pro', 'Court 2 · Pro', 'Court 3 · Match'];
    const hours = [6, 7, 8, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22];
    const taken = new Set(['0-7', '0-18', '0-19', '1-6', '1-20', '2-8', '2-17', '3-19', '4-20', '5-7', '6-18', '6-19']);
    const state = { day: 0, court: 0, hour: null };

    const fmtM = d => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const fmtD = d => ({ w: d.toLocaleDateString('en-GB', { weekday: 'short' }), n: d.getDate() });
    if (monthEl) monthEl.textContent = fmtM(days[0]);

    if (daysEl) {
      daysEl.innerHTML = days.map((d, i) => {
        const { w, n } = fmtD(d);
        return `<button class="bw__day${i === 0 ? ' is-on' : ''}" data-i="${i}" type="button"><span>${w}</span><b>${n}</b></button>`;
      }).join('');
    }

    if (courtsEl) {
      courtsEl.innerHTML = courts.map((c, i) =>
        `<button class="bw__court${i === 0 ? ' is-on' : ''}" data-i="${i}" type="button">${c}</button>`
      ).join('');
    }

    function grid() {
      if (!gridEl) return;
      gridEl.innerHTML = hours.map(h => {
        const key = `${state.court}-${h}`;
        const isTaken = taken.has(key);
        const on = state.hour === h;
        return `<button class="slot${isTaken ? ' is-taken' : ''}${on ? ' is-on' : ''}" data-h="${h}" ${isTaken ? 'disabled' : ''} type="button"><span>${String(h).padStart(2, '0')}:00</span></button>`;
      }).join('');
    }

    function summary() {
      if (!sumEl || !priceEl || !goEl) return;
      if (state.hour === null) {
        sumEl.textContent = 'Select an hour on the grid';
        priceEl.textContent = '—';
        goEl.setAttribute('aria-disabled', 'true');
        goEl.removeAttribute('href');
        return;
      }
      const d = days[state.day];
      const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      sumEl.textContent = `${courts[state.court]} · ${dateStr} · ${String(state.hour).padStart(2, '0')}:00`;
      const isPeak = state.hour >= 18;
      priceEl.textContent = isPeak ? '₹1,200' : '₹800';
      goEl.setAttribute('aria-disabled', 'false');
      goEl.href = `/book?court=${state.court + 1}&hour=${state.hour}`;
    }

    if (daysEl) {
      daysEl.addEventListener('click', e => {
        const b = e.target.closest('.bw__day'); if (!b) return;
        $$('.bw__day', daysEl).forEach(x => x.classList.remove('is-on'));
        b.classList.add('is-on'); state.day = +b.dataset.i; state.hour = null;
        if (monthEl) monthEl.textContent = fmtM(days[state.day]);
        grid(); summary();
      });
    }

    if (courtsEl) {
      courtsEl.addEventListener('click', e => {
        const b = e.target.closest('.bw__court'); if (!b) return;
        $$('.bw__court', courtsEl).forEach(x => x.classList.remove('is-on'));
        b.classList.add('is-on'); state.court = +b.dataset.i; state.hour = null;
        grid(); summary();
      });
    }

    if (gridEl) {
      gridEl.addEventListener('click', e => {
        const b = e.target.closest('.slot'); if (!b || b.disabled) return;
        $$('.slot', gridEl).forEach(x => x.classList.remove('is-on'));
        b.classList.add('is-on'); state.hour = +b.dataset.h;
        summary();
      });
    }

    grid(); summary();
  })();

  /* ---------- mobile menu ---------- */
  (function menu() {
    const menu = $('#menu'), btn = $('.nav__menu'); let open = false;
    if (!menu || !btn) return;
    function toggle(to) {
      open = typeof to === 'boolean' ? to : !open;
      btn.setAttribute('aria-expanded', String(open));
      if (open) { gsap.set(menu, { visibility: 'visible' }); gsap.to(menu, { clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'power4.inOut' }); gsap.fromTo($$('a', menu), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .8, ease: 'power3.out', delay: .3 }); window.lenis && lenis.stop(); }
      else { gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: .7, ease: 'power4.inOut', onComplete: () => gsap.set(menu, { visibility: 'hidden' }) }); window.lenis && lenis.start(); }
    }
    btn.addEventListener('click', () => toggle());
    $$('a', menu).forEach(a => a.addEventListener('click', () => toggle(false)));
  })();

  /* ---------- smooth scroll & cross-page navigation ---------- */
  if (typeof Lenis !== 'undefined' && !reduce) {
    const lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function resolveHash(href) {
    if (!href) return null;
    if (href.startsWith('#')) return href;
    if (href.startsWith('/#')) return href.slice(1);
    return null;
  }

  function scrollToTarget(targetHash) {
    const targetEl = document.querySelector(targetHash);
    if (!targetEl) return false;
    if (window.lenis) {
      window.lenis.scrollTo(targetEl, { offset: -60, duration: 1.4 });
    } else {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
    return true;
  }

  document.addEventListener('click', e => {
    const anchor = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    const hash = resolveHash(href);
    if (!hash) return;
    const onLanding = window.location.pathname === '/' || window.location.pathname === '';
    if (onLanding) {
      const target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        history.pushState(null, '', hash);
        scrollToTarget(hash);
        const menuBtn = $('.nav__menu');
        if (menuBtn && menuBtn.getAttribute('aria-expanded') === 'true') menuBtn.click();
      }
    }
  });

  function checkHashScroll() {
    if (window.location.hash) {
      setTimeout(() => {
        scrollToTarget(window.location.hash);
        const menuBtn = $('.nav__menu');
        if (menuBtn && menuBtn.getAttribute('aria-expanded') === 'true') {
          menuBtn.click();
        }
      }, 350);
    }
  }

  if (document.readyState === 'complete') checkHashScroll();
  else addEventListener('load', checkHashScroll);

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
      heroIntro.play();
    } else {
      let count = { val: 0 };
      const countEl = $('.loader__count');
      const tl = gsap.timeline({
        onComplete() {
          gsap.to('.loader', {
            yPercent: -100, duration: 1.25, ease: 'power4.inOut',
            onComplete() { gsap.set('.loader', { display: 'none' }); heroIntro.play(); }
          });
        }
      });
      tl.to(count, {
        val: 100, duration: 2.2, ease: 'power2.inOut',
        onUpdate() { if (countEl) countEl.textContent = String(Math.round(count.val)).padStart(3, '0'); }
      }, 0);
      tl.to('.loader__line', { scaleX: 1, duration: 2.2, ease: 'power2.inOut' }, 0);
      tl.to('.loader__word span', { yPercent: -100, duration: .9, ease: 'power4.inOut', stagger: .08 }, 1.3);
    }

    /* ---------- hero scroll parallax + mouse drift ---------- */
    gsap.to('.hero__media img', {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    if (fine) {
      const hero = $('.hero'), img = $('.hero__media img');
      const qx = gsap.quickTo(img, 'x', { duration: 1.2, ease: 'power3' }), qy = gsap.quickTo(img, 'y', { duration: 1.2, ease: 'power3' });
      if (hero) {
        hero.addEventListener('mousemove', e => {
          const { left, top, width, height } = hero.getBoundingClientRect();
          const x = (e.clientX - left) / width - .5, y = (e.clientY - top) / height - .5;
          qx(x * 32); qy(y * 22);
        });
        hero.addEventListener('mouseleave', () => { qx(0); qy(0); });
      }
    }

    /* ---------- ticker, sped up by scroll velocity ---------- */
    const ticker = $('.ticker__track');
    if (ticker) {
      let vel = 0, lastY = scrollY;
      addEventListener('scroll', () => { const now = scrollY; vel = Math.abs(now - lastY); lastY = now; }, { passive: true });
      let base = 0;
      gsap.ticker.add(() => {
        base += 0.8 + Math.min(vel * .12, 10);
        vel *= .92;
        ticker.style.transform = `translate3d(-${base % (ticker.scrollWidth / 2)}px, 0, 0)`;
      });
    }

    /* ---------- generic reveals ---------- */
    $$('[data-fade]').forEach(el => {
      gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    $$('[data-lines]').forEach(el => {
      const spans = $$('.ln > span', el);
      gsap.to(spans, { yPercent: 0, duration: 1.4, ease: 'power4.out', stagger: .1, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });

    $$('[data-reveal]').forEach(el => {
      const dir = el.dataset.reveal === 'left';
      const img = $('img', el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
      tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power4.inOut' }, 0);
      if (img) tl.to(img, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0);
    });

    /* ---------- manifesto: words brighten as you read ---------- */
    const quote = $('.manifesto__quote');
    if (quote && typeof SplitText !== 'undefined') {
      const split = new SplitText(quote, { type: 'words' });
      gsap.fromTo(split.words,
        { color: 'var(--mid-25)' },
        { color: 'var(--midnight)', ease: 'none', stagger: .08, scrollTrigger: { trigger: quote, start: 'top 75%', end: 'bottom 50%', scrub: true } }
      );
    }

    /* ---------- responsive: chapters + horizontal day + facilities ---------- */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      // chapters pin
      const chImgs = $$('.chapter__img');
      chImgs.forEach((im, i) => { if (i > 0) gsap.set(im, { clipPath: 'inset(100% 0% 0% 0%)' }); });
      $$('.chapter').forEach((ch, i) => {
        if (i === 0) return;
        ScrollTrigger.create({
          trigger: ch, start: 'top center', end: 'bottom center',
          onEnter: () => gsap.to(chImgs[i], { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.inOut' }),
          onLeaveBack: () => gsap.to(chImgs[i], { clipPath: 'inset(100% 0% 0% 0%)', duration: .9, ease: 'power4.inOut' })
        });
      });

      // horizontal day
      const track = $('.day__track'), bar = $('.day__bar > i');
      const dist = () => track.scrollWidth - innerWidth;
      const hTween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.day', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: s => gsap.set(bar, { scaleX: s.progress }) }
      });
      $$('.stop .frame img').forEach(img => gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: img.closest('.stop'), containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } }));
      $$('.stop').forEach(st => gsap.from($('.stop__time', st), { xPercent: 20, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: st, containerAnimation: hTween, start: 'left 85%', toggleActions: 'play none none reverse' } }));

      // facilities - floating image follows the cursor (auto-hides on leave and scroll)
      if (fine) {
        const fl = $('.float-img'), imgs = $$('img', fl);
        if (fl) {
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

    /* ---------- magnetic buttons + cursor (pavilion-editorial verified) ---------- */
    $$('.magnetic').forEach(btn => {
      const bx = gsap.quickTo(btn, 'x', { duration: .6, ease: 'power3' }), by = gsap.quickTo(btn, 'y', { duration: .6, ease: 'power3' });
      btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); bx((e.clientX - (r.left + r.width / 2)) * .32); by((e.clientY - (r.top + r.height / 2)) * .32); });
      btn.addEventListener('mouseleave', () => { bx(0); by(0); });
    });

    const dot = $('.cursor'), ring = $('.cursor-ring');
    if (dot && ring && !reduce) {
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

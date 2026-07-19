/* LF motion core: Lenis smooth scroll, Barba surge transitions, reduced-motion
   switchboard, and the section init registry dispatch. Sections register
   behavior in lf-sections.js as LF.init.<name>(root, ctx); this file calls
   them on first load and after every Barba swap. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.LF = window.LF || {};
  LF.init = LF.init || {};
  LF.ctx = { reduced: reduced };

  function runInits(root) {
    Object.keys(LF.init).forEach(function (k) {
      try { LF.init[k](root || document, LF.ctx); } catch (e) { if (window.console) console.error('[LF] init "' + k + '" failed', e); }
    });
  }
  LF.runInits = runInits;

  // Smooth scroll
  if (!reduced && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.11 });
    window.lfLenis = lenis;
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
    }
  }

  // Scroll reveals ([data-lf-reveal]) as a registry init so swapped-in pages get them too.
  LF.init.reveals = function (root, ctx) {
    var els = (root || document).querySelectorAll('[data-lf-reveal]:not(.lf-revealed)');
    if (ctx.reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('lf-revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('lf-revealed'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };

  // First-load dispatch (scripts are deferred: DOM is ready).
  runInits(document);

  // ——— Barba surge transitions ———
  if (!window.barba || !window.gsap) { if (window.console) console.warn('[LF] barba/gsap missing — falling back to native navigation'); return; }
  var blackout = document.getElementById('lf-blackout');
  if (!blackout) { if (window.console) console.warn('[LF] #lf-blackout missing — falling back to native navigation'); return; }

  if (reduced) {
    // Instant swap, no surge — still Barba so nav stays consistent, but zero animation.
    barba.init({
      timeout: 7000,
      prevent: preventRule,
      transitions: [{
        leave: function () {},
        enter: function () { window.scrollTo(0, 0); }
      }]
    });
  } else {
    barba.init({
      timeout: 7000,
      prevent: preventRule,
      transitions: [{
        leave: function (data) {
          var f = trimFactor(); // read before bumping — this nav's OWN count decides its trim, not itself
          bumpNav();
          return gsap.timeline()
            .to(data.current.container, {
              keyframes: [{ opacity: .1 }, { opacity: 1 }, { opacity: .15 }, { opacity: .9 }, { opacity: .05 }, { opacity: 0 }],
              duration: .55 * f, ease: 'steps(5)'
            })
            .to(blackout, { opacity: 1, duration: .12 * f }, '<70%')
            .then();
        },
        enter: function (data) {
          window.scrollTo(0, 0);
          if (window.lfLenis) lfLenis.scrollTo(0, { immediate: true });
          var f = trimFactor();
          gsap.set(data.next.container, { opacity: 0 });
          return gsap.timeline()
            .to(blackout, { opacity: 0, duration: .15 * f, delay: .15 * f })
            .to(data.next.container, {
              keyframes: [{ opacity: .8 }, { opacity: .1 }, { opacity: 1 }, { opacity: .2 }, { opacity: 1 }, { opacity: .6 }, { opacity: 1 }],
              duration: .9 * f, ease: 'steps(6)'
            }, '<')
            .then();
        }
      }]
    });
  }

  function preventRule(data) {
    var el = data.el;
    var href = (data.href || '');
    if (el && el.closest('[data-no-barba]')) return true;
    if (/\/(checkouts?|account|password)(\/|\?|$)|\/cart\/c\//.test(href)) return true;
    return false;
  }

  var navCount = 0;
  try { navCount = parseInt(sessionStorage.getItem('lfNav') || '0', 10) || 0; } catch (e) {}
  function bumpNav() { navCount++; try { sessionStorage.setItem('lfNav', String(navCount)); } catch (e) {} }
  function trimFactor() { return navCount > 0 ? 0.7 : 1; }

  barba.hooks.beforeLeave(function () {
    if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
  });
  barba.hooks.afterEnter(function (data) {
    var m = data && data.next && data.next.html && data.next.html.match(/<title>([\s\S]*?)<\/title>/i);
    if (m) {
      var t = document.createElement('textarea'); t.innerHTML = m[1]; document.title = t.value;
    }
    runInits(data.next.container);
    var main = document.getElementById('lf-main');
    if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
  });
})();

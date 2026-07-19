/* LF global chrome: menu overlay, preloader, cursor labels, newsletter popup,
   easter-egg overlay, nav behaviors, footer image-follow. Registry inits are
   dispatched by lf-motion.js on first load and after every Barba swap. Chrome
   DOM lives OUTSIDE the Barba container, so every init here binds once and
   guards with data-lf-bound; only per-swap resources (nav recolor triggers)
   register LF.teardown entries. */
(function () {
  window.LF = window.LF || {};
  LF.init = LF.init || {};
  LF.teardown = LF.teardown || [];

  var FINE = window.matchMedia('(min-width: 992px) and (pointer: fine)');

  // Body scroll lock shared by menu + popup. Counted so nested opens are safe.
  var lockCount = 0;
  LF.scrollLock = function (on) {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    document.documentElement.style.overflow = lockCount > 0 ? 'hidden' : '';
  };
  // Hard reset for Barba navigation — a locked overlay's own nav link can
  // trigger a page swap without ever calling scrollLock(false) itself.
  LF.scrollLock.reset = function () {
    lockCount = 0;
    document.documentElement.style.overflow = '';
  };

  // Minimal focus trap: keeps Tab inside `root` until release() is called.
  LF.trapFocus = function (root) {
    if (root._lfTrapRelease) root._lfTrapRelease();
    var prev = document.activeElement;
    var sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(root.querySelectorAll(sel), function (el) {
        return el.offsetParent !== null;
      });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      var active = document.activeElement;
      var activeIsInside = items.indexOf(active) > -1;
      if (!activeIsInside) {
        // Focus escaped the tracked list (e.g. a mouse click landed on a
        // non-focusable element inside root) — pull it back in rather than
        // letting the next Tab walk out of the trap natively.
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    var target = Array.prototype.find.call(root.querySelectorAll(sel), function (el) {
      return el.offsetParent !== null;
    });
    if (target) target.focus();
    var release = function () {
      document.removeEventListener('keydown', onKey);
      root._lfTrapRelease = null;
      if (prev && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) {} }
    };
    root._lfTrapRelease = release;
    return release;
  };

  // ——— Nav behaviors: section-aware brighten + pull-up at footer ———
  // Markers live INSIDE the swapped container, so triggers are re-created on
  // every dispatch and die in lf-motion.js's beforeLeave ScrollTrigger sweep.
  LF.init.navBehaviors = function (root) {
    var header = document.querySelector('[data-lf-header]');
    if (!header || !window.ScrollTrigger) return;
    header.classList.remove('is-bright', 'is-pulled');
    (root || document).querySelectorAll('[data-nav-light]').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top top', end: 'bottom top',
        onEnter: function () { header.classList.add('is-bright'); },
        onEnterBack: function () { header.classList.add('is-bright'); },
        onLeave: function () { header.classList.remove('is-bright'); },
        onLeaveBack: function () { header.classList.remove('is-bright'); }
      });
    });
    var footer = document.querySelector('.lf-footer');
    if (footer) {
      ScrollTrigger.create({
        trigger: footer, start: 'clamp(top 20%)',
        onEnter: function () { header.classList.add('is-pulled'); },
        onLeaveBack: function () { header.classList.remove('is-pulled'); }
      });
    }
  };

  // ——— Full-screen menu overlay ———
  LF.init.menu = function (root, ctx) {
    var menu = document.querySelector('[data-lf-menu-root]');
    if (!menu || menu.hasAttribute('data-lf-bound')) return;
    menu.setAttribute('data-lf-bound', '1');
    var openBtns = document.querySelectorAll('[data-lf-menu-open]');
    var veil = menu.querySelector('.lf-menu__veil');
    var imgPanel = menu.querySelector('.lf-menu__imgpanel');
    var panels = menu.querySelectorAll('.lf-menu__panel');
    var links = menu.querySelectorAll('.lf-menu__link');
    var fades = menu.querySelectorAll('[data-lf-menu-fade]');
    var release = null;

    function setOpenState(open) {
      menu.setAttribute('aria-hidden', String(!open));
      openBtns.forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
    }

    function releaseFocusAndScroll() {
      if (release) { release(); release = null; }
      LF.scrollLock(false);
    }

    function open() {
      LF.scrollLock(true);
      setOpenState(true);
      if (ctx.reduced || !window.gsap) {
        menu.setAttribute('data-state', 'open');
        release = LF.trapFocus(menu);
        return;
      }
      menu.setAttribute('data-state', 'animating');
      // Force a clean pixel baseline before re-deriving yPercent: GSAP's
      // first touch of an element with a CSS-declared percentage transform
      // caches the browser's resolved matrix as its `y`, then treats a
      // subsequent yPercent as ADDITIVE rather than replacing it — doubling
      // the offset. Without this, the fromTo below silently no-ops.
      gsap.set([imgPanel, panels], { y: 0 });
      gsap.set([imgPanel, panels], { yPercent: -101 });
      gsap.timeline({ onComplete: function () {
          menu.setAttribute('data-state', 'open');
          release = LF.trapFocus(menu);
        } })
        .fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4, ease: 'expo.out' })
        .fromTo(imgPanel, { yPercent: -101 }, { yPercent: 0, duration: .575, ease: 'lf-ease-3' }, '<')
        .fromTo(panels, { yPercent: -101 }, { yPercent: 0, stagger: 0.1, duration: .575, ease: 'lf-ease-3' }, '<15%')
        .fromTo(links, { yPercent: 130 }, { yPercent: 0, stagger: 0.05, duration: .575, ease: 'lf-ease-3' }, '<20%')
        .fromTo(fades, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4, ease: 'sine.out' }, '<70%');
    }

    function close(afterFn) {
      releaseFocusAndScroll();
      if (ctx.reduced || !window.gsap) {
        setOpenState(false);
        menu.setAttribute('data-state', 'closed');
        if (afterFn) afterFn();
        return;
      }
      menu.setAttribute('data-state', 'animating');
      gsap.timeline({ onComplete: function () {
          setOpenState(false);
          menu.setAttribute('data-state', 'closed');
          if (afterFn) afterFn();
        } })
        .to(fades, { autoAlpha: 0, duration: .3, ease: 'expo.out' })
        .to(links, { yPercent: 130, duration: .45, ease: 'expo.out' }, '<')
        .to(panels, { yPercent: -101, stagger: 0.1, duration: .5, ease: 'expo.out' }, '<10%')
        .to(imgPanel, { yPercent: -101, duration: .5, ease: 'expo.out' }, '<')
        .to(veil, { autoAlpha: 0, duration: .3 }, '<30%');
    }

    openBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (menu.getAttribute('data-state') === 'closed') open();
      });
    });
    menu.addEventListener('click', function (e) {
      var closer = e.target.closest('[data-lf-menu-close]');
      if (!closer || menu.getAttribute('data-state') !== 'open') return;
      var link = closer.closest('a[href]');
      if (link) {
        // Let Barba take the navigation; close instantly so the surge owns the screen.
        releaseFocusAndScroll();
        setOpenState(false);
        menu.setAttribute('data-state', 'closed');
        gsap && gsap.set([veil, imgPanel, panels, links, fades], { clearProps: 'all' });
      } else {
        e.preventDefault();
        close();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.getAttribute('data-state') === 'open') close();
    });
  };

  // ——— First-visit preloader + popup auto-open ———
  LF.init.preloader = function (root, ctx) {
    var pre = document.querySelector('[data-lf-preloader]');
    if (!pre || pre.hasAttribute('data-lf-bound')) return;
    pre.setAttribute('data-lf-bound', '1');
    var firstVisit = document.documentElement.classList.contains('lf-first-visit');
    try { sessionStorage.setItem('lfVisited', '1'); } catch (e) {}
    // Also gates the popup-timer block below — both features share this
    // one "did we already handle this session" flag.
    if (!firstVisit) return;

    function done() {
      pre.style.display = 'none';
      document.documentElement.classList.remove('lf-first-visit');
    }
    if (ctx.reduced || !window.gsap) { done(); }
    else {
      var crest = pre.querySelector('.lf-preloader__crest');
      var img = pre.querySelector('.lf-preloader__img');
      gsap.timeline({ onComplete: done })
        .to(crest, { opacity: 1, duration: .9, ease: 'sine.in' })
        .to(crest, { keyframes: [{ opacity: .2 }, { opacity: 1 }, { opacity: .4 }, { opacity: 1 }], duration: .45, ease: 'steps(3)' })
        .to(img, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: .7, ease: 'lf-ease-3' }, '<')
        .to(pre, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', duration: .7, ease: 'lf-ease-3', delay: .2 });
    }

    // Newsletter auto-open: once per session, 10s after first-ever load.
    try {
      if (!sessionStorage.getItem('lfPopupShown')) {
        setTimeout(function () {
          // Own try/catch: this runs in a separate call stack 10s later, so
          // the outer try/catch above (which only covers the synchronous
          // setup) can't protect it — a storage failure here must not be
          // able to block the actual popup open below.
          try { sessionStorage.setItem('lfPopupShown', '1'); } catch (e) {}
          if (LF.openSignup) LF.openSignup();
        }, 10000);
      }
    } catch (e) {}
  };
})();

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
})();

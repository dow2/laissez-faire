/* LF motion bootstrap: Lenis smooth scroll + data-lf-reveal helper.
   All motion is skipped under prefers-reduced-motion. B2 layers Barba/SplitText on top. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduced && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.11 });
    window.lfLenis = lenis;
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  // Scroll reveals: elements with [data-lf-reveal] fade/rise in once.
  var els = document.querySelectorAll('[data-lf-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('lf-revealed'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('lf-revealed'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

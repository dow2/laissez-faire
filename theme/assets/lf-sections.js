/* LF section behaviors as registry inits. Registered here, dispatched by
   lf-motion.js on first load and after every Barba swap. Each init must be
   idempotent: guard with data-lf-bound markers, and query within `root`. */
(function () {
  window.LF = window.LF || {};
  LF.init = LF.init || {};

  var fmtCache = {};
  LF.money = function (cents) {
    var cur = (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD';
    fmtCache[cur] = fmtCache[cur] || new Intl.NumberFormat(undefined, { style: 'currency', currency: cur });
    return fmtCache[cur].format(cents / 100);
  };
  LF.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // ——— Header: mobile overlay menu (header persists outside Barba; bind once) ———
  LF.init.header = function () {
    var burger = document.querySelector('[data-lf-menu-toggle]');
    var overlay = document.querySelector('[data-lf-menu]');
    if (!burger || !overlay || burger.hasAttribute('data-lf-bound')) return;
    burger.setAttribute('data-lf-bound', '1');
    burger.addEventListener('click', function () {
      var open = overlay.hasAttribute('hidden');
      if (open) { overlay.removeAttribute('hidden'); } else { overlay.setAttribute('hidden', ''); }
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
    });
    overlay.addEventListener('click', function (e) {
      if (e.target.closest('a')) { overlay.setAttribute('hidden', ''); document.documentElement.style.overflow = ''; }
    });
  };

  // ——— Hero slider: buttons, autoplay, horizontal gestures ———
  LF.init.hero = function (root, ctx) {
    var hero = (root || document).querySelector('[data-lf-hero]');
    if (!hero || hero.hasAttribute('data-lf-bound')) return;
    hero.setAttribute('data-lf-bound', '1');
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-lf-slide]'));
    var cur = hero.querySelector('[data-lf-current]');
    var i = 0, n = slides.length, timer = null;
    var secs = parseInt(hero.getAttribute('data-autoplay'), 10) || 0;
    function go(next) {
      slides[i].classList.remove('is-active');
      i = (next + n) % n;
      slides[i].classList.add('is-active');
      if (cur) cur.textContent = String(i + 1).padStart(2, '0');
    }
    function arm() {
      if (secs > 0 && !ctx.reduced && n > 1) { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, secs * 1000); }
    }
    var next = hero.querySelector('[data-lf-next]'), prev = hero.querySelector('[data-lf-prev]');
    if (next) next.addEventListener('click', function () { go(i + 1); arm(); });
    if (prev) prev.addEventListener('click', function () { go(i - 1); arm(); });
    arm();
    // Horizontal-only gestures; vertical scroll stays native.
    if (!ctx.reduced && window.Observer && n > 1) {
      Observer.create({
        target: hero, type: 'touch,wheel', lockAxis: true, tolerance: 60, preventDefault: false,
        onLeft: function () { go(i + 1); arm(); },
        onRight: function () { go(i - 1); arm(); }
      });
    }
  };

  // ——— PDP: variant sync, gallery, AJAX add-to-cart ———
  LF.init.pdp = function (root) {
    var pdp = (root || document).querySelector('[data-lf-pdp]');
    if (!pdp || pdp.hasAttribute('data-lf-bound')) return;
    pdp.setAttribute('data-lf-bound', '1');
    var variants = JSON.parse(pdp.querySelector('[data-lf-variants]').textContent);
    var form = pdp.querySelector('form');
    var idInput = pdp.querySelector('[data-lf-variant-id]');
    var priceEl = pdp.querySelector('[data-lf-price]');
    var addBtn = pdp.querySelector('[data-lf-add]');
    var addPrice = pdp.querySelector('[data-lf-add-price]');
    var soldEl = pdp.querySelector('[data-lf-soldout]');
    var slides = Array.prototype.slice.call(pdp.querySelectorAll('[data-lf-gslide]'));
    var gnum = pdp.querySelector('[data-lf-gnum]');
    var gi = 0;
    function selectedOptions() {
      var opts = [];
      pdp.querySelectorAll('.lf-pdp__opt').forEach(function (fs, idx) {
        var checked = fs.querySelector('input:checked');
        opts[idx] = checked ? checked.value : null;
      });
      return opts;
    }
    function findVariant(opts) {
      return variants.find(function (v) { return v.options.every(function (o, idx) { return o === opts[idx]; }); });
    }
    function showSlide(nn) {
      if (!slides.length) return;
      slides[gi].classList.remove('is-active');
      gi = (nn + slides.length) % slides.length;
      slides[gi].classList.add('is-active');
      if (gnum) gnum.textContent = (gi + 1) + ' / ' + slides.length;
    }
    function syncGalleryTo(garment) {
      var target = slides.findIndex(function (s) { return (s.getAttribute('data-alt') || '').indexOf(garment) === 0; });
      if (target >= 0) showSlide(target);
    }
    function update() {
      var opts = selectedOptions();
      var v = findVariant(opts);
      if (v) {
        idInput.value = v.id;
        priceEl.textContent = LF.money(v.price);
        addPrice.textContent = LF.money(v.price);
        addBtn.disabled = !v.available;
        soldEl.hidden = v.available;
      }
      if (opts[0]) syncGalleryTo(opts[0]);
    }
    pdp.querySelectorAll('.lf-pdp__opt input').forEach(function (r) { r.addEventListener('change', update); });
    var gp = pdp.querySelector('[data-lf-gprev]'), gn = pdp.querySelector('[data-lf-gnext]');
    if (gp) gp.addEventListener('click', function () { showSlide(gi - 1); });
    if (gn) gn.addEventListener('click', function () { showSlide(gi + 1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      addBtn.disabled = true;
      fetch('/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(idInput.value, 10), quantity: 1 })
      }).then(function (r) {
        if (!r.ok) throw new Error('add failed');
        return r.json();
      }).then(function () {
        addBtn.disabled = false;
        document.dispatchEvent(new CustomEvent('lf:cart:added'));
      }).catch(function () {
        addBtn.disabled = false;
        window.location.href = '/cart';
      });
    });
    update();
  };

  // ——— Letter ignite (SplitText + ScrollTrigger) ———
  LF.init.ignite = function (root, ctx) {
    var els = (root || document).querySelectorAll('[data-lf-ignite]:not([data-lf-ignited])');
    els.forEach(function (el) {
      el.setAttribute('data-lf-ignited', '1');
      if (ctx.reduced || !window.SplitText || !window.ScrollTrigger || !window.gsap) {
        el.classList.add('lf-lit');
        return;
      }
      var split = new SplitText(el, { type: 'chars', charsClass: 'lf-ignite-char' });
      var per = Math.min(0.055, 0.9 / Math.max(split.chars.length, 1));
      ScrollTrigger.create({
        trigger: el, start: 'top 55%', once: true,
        onEnter: function () {
          gsap.to(split.chars, {
            keyframes: [{ opacity: .5 }, { opacity: .12 }, { opacity: 1 }, { opacity: .3 }, { opacity: 1 }],
            duration: .5, ease: 'steps(4)', stagger: per,
            onComplete: function () { el.classList.add('lf-ignite-done'); }
          });
        }
      });
    });
  };

  // ——— Footer crest cursor-follow (footer persists; bind once) ———
  LF.init.footerFollow = function (root, ctx) {
    if (ctx.reduced || !window.gsap) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    var wm = document.querySelector('.lf-footer__wordmark');
    var crest = document.querySelector('.lf-follow-crest');
    if (!wm || !crest || crest.hasAttribute('data-lf-bound')) return;
    crest.setAttribute('data-lf-bound', '1');
    var qx = gsap.quickTo(crest, 'x', { duration: 0.4, ease: 'power3' });
    var qy = gsap.quickTo(crest, 'y', { duration: 0.4, ease: 'power3' });
    var zone = wm.closest('.lf-footer') || wm;
    zone.addEventListener('mousemove', function (e) {
      qx(e.clientX - 32); qy(e.clientY - 40);
    });
    zone.addEventListener('mouseenter', function () { gsap.to(crest, { opacity: .9, duration: .3 }); });
    zone.addEventListener('mouseleave', function () { gsap.to(crest, { opacity: 0, duration: .3 }); });
  };
})();

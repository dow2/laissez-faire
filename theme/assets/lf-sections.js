/* LF section behaviors as registry inits. Registered here, dispatched by
   lf-motion.js on first load and after every Barba swap. Each init must be
   idempotent: guard with data-lf-bound markers, and query within `root`. */
(function () {
  window.LF = window.LF || {};
  LF.init = LF.init || {};
  // Cleanup fns for resources created per-swap (timers, Observer instances) that
  // don't self-destruct when their DOM is discarded. lf-motion.js's beforeLeave
  // hook runs and clears this list, mirroring its ScrollTrigger.getAll().kill().
  LF.teardown = LF.teardown || [];

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
    // Observer-driven swipe/wheel gestures were dropped here (Task 10, Lighthouse
    // fallback ladder rung 2) — the vendor + its setup cost pushed mobile TBT
    // over budget. Arrow buttons + autoplay remain fully functional.
    // This closure's timer belongs to THIS hero instance and won't self-clean
    // when Barba discards its container on the next navigation.
    LF.teardown.push(function () { clearInterval(timer); });
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
      // A hung request (flaky network, dead connection) must not leave the
      // buy button disabled forever with no feedback — abort after 12s.
      var controller = ('AbortController' in window) ? new AbortController() : null;
      var timedOut = false;
      var watchdog = controller ? setTimeout(function () { timedOut = true; controller.abort(); }, 12000) : null;
      fetch('/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(idInput.value, 10), quantity: 1 }),
        signal: controller ? controller.signal : undefined
      }).then(function (r) {
        if (watchdog) clearTimeout(watchdog);
        if (!r.ok) throw new Error('add failed');
        return r.json();
      }).then(function () {
        addBtn.disabled = false;
        document.dispatchEvent(new CustomEvent('lf:cart:added'));
      }).catch(function () {
        if (watchdog) clearTimeout(watchdog);
        addBtn.disabled = false;
        if (!timedOut) window.location.href = '/cart';
        // On timeout, stay on the PDP with the button re-enabled rather than
        // navigating away from an add that may or may not have gone through.
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
      function fire() {
        gsap.to(split.chars, {
          keyframes: [{ opacity: .5 }, { opacity: .12 }, { opacity: 1 }, { opacity: .3 }, { opacity: 1 }],
          duration: .5, ease: 'steps(4)', stagger: per,
          onComplete: function () { el.classList.add('lf-ignite-done'); }
        });
      }
      // ScrollTrigger's onEnter only fires on a scroll crossing INTO the trigger
      // zone — an element already above-the-fold at bind time (a page's own H1,
      // e.g. collection/story/PDP titles) is already "inside" the zone and would
      // never receive that event, staying permanently dim. Fire immediately for
      // anything already past the trigger line; ScrollTrigger only for the rest.
      // (Requires the outgoing Barba container to already be display:none — see
      // lf-motion.js leave() — otherwise this reads a phantom pushed-down position.)
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.55) {
        fire();
      } else {
        ScrollTrigger.create({ trigger: el, start: 'top 55%', once: true, onEnter: fire });
      }
    });
  };

  // ——— Home hero v2: numbered nav, directional clip wipes, swipe ———
  LF.init.heroV2 = function (root, ctx) {
    var hero = (root || document).querySelector('[data-lf-hero-v2]');
    if (!hero || hero.hasAttribute('data-lf-bound')) return;
    hero.setAttribute('data-lf-bound', '1');
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-lf-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-lf-hero-dot]'));
    var n = slides.length;
    if (n < 2) return;
    var i = 0, timer = null;
    var secs = parseInt(hero.getAttribute('data-autoplay'), 10) || 0;

    function go(nextIndex, forwards) {
      if (hero.getAttribute('data-state') === 'animating') return;
      var nextI = (nextIndex + n) % n;
      if (nextI === i) return;
      var prevSlide = slides[i], nextSlide = slides[nextI];
      var prevVisual = prevSlide.querySelector('[data-lf-hero-visual]');
      var nextVisual = nextSlide.querySelector('[data-lf-hero-visual]');
      dots[i].classList.remove('is-active');
      dots[nextI].classList.add('is-active');
      i = nextI;
      if (ctx.reduced || !window.gsap) {
        prevSlide.classList.remove('is-active');
        nextSlide.classList.add('is-active');
        return;
      }
      var openPoly = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
      var closedTop = 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)';
      var closedBottom = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
      nextSlide.classList.add('is-active');
      hero.setAttribute('data-state', 'animating');
      var tl = gsap.timeline({
        defaults: { duration: 1, ease: 'lf-ease-3' },
        onComplete: function () { prevSlide.classList.remove('is-active'); hero.setAttribute('data-state', 'idle'); }
      });
      if (forwards) {
        gsap.set(nextSlide, { clipPath: closedTop });
        tl.to(nextSlide, { clipPath: openPoly })
          .to(prevSlide, { clipPath: closedBottom }, '<')
          .fromTo(prevVisual, { yPercent: 0 }, { yPercent: 10 }, '<')
          .fromTo(nextVisual, { yPercent: -10 }, { yPercent: 0 }, '<');
      } else {
        gsap.set(nextSlide, { clipPath: closedBottom });
        tl.to(nextSlide, { clipPath: openPoly })
          .to(prevSlide, { clipPath: closedTop }, '<')
          .fromTo(prevVisual, { yPercent: 0 }, { yPercent: -10 }, '<')
          .fromTo(nextVisual, { yPercent: 10 }, { yPercent: 0 }, '<');
      }
    }
    function arm() {
      if (secs > 0 && !ctx.reduced && n > 1) { clearInterval(timer); timer = setInterval(function () { go(i + 1, true); }, secs * 1000); }
    }
    var nextBtn = hero.querySelector('[data-lf-hero-next]');
    if (nextBtn) nextBtn.addEventListener('click', function () { go(i + 1, true); arm(); });
    dots.forEach(function (dot) {
      dot.querySelector('button').addEventListener('click', function () {
        var target = parseInt(dot.getAttribute('data-index'), 10);
        go(target, target > i);
        arm();
      });
    });
    // Mobile swipe via native Pointer Events (no Observer plugin per spec constraint).
    var list = hero.querySelector('[data-lf-hero-list]');
    var downX = null, activePointerId = null;
    list.addEventListener('pointerdown', function (e) {
      if (activePointerId != null) return; // ignore a second concurrent pointer
      activePointerId = e.pointerId;
      downX = e.clientX;
    });
    function endSwipe(e, shouldNavigate) {
      if (e.pointerId !== activePointerId) return;
      var dx = shouldNavigate ? e.clientX - downX : 0;
      activePointerId = null;
      downX = null;
      if (!shouldNavigate || Math.abs(dx) < 40) return;
      go(i + (dx < 0 ? 1 : -1), dx < 0);
      arm();
    }
    list.addEventListener('pointerup', function (e) { endSwipe(e, true); });
    list.addEventListener('pointercancel', function (e) { endSwipe(e, false); });
    arm();
    LF.teardown.push(function () { clearInterval(timer); });
  };
})();

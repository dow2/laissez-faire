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
      // type must include 'words' — 'chars' alone wraps every character in its
      // own atomic inline-block with no word-level grouping, so the browser has
      // no concept of "word" for line-wrapping and can (and does) break between
      // any two adjacent character boxes instead of only at spaces.
      var split = new SplitText(el, { type: 'words, chars', wordsClass: 'lf-ignite-word', charsClass: 'lf-ignite-char' });
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

  // ——— CTA row: cursor-following label pill per card (desktop only) ———
  LF.init.ctaFollow = function (root, ctx) {
    var row = (root || document).querySelector('.lf-ctarow');
    if (!row || row.hasAttribute('data-lf-bound')) return;
    row.setAttribute('data-lf-bound', '1');
    // Cursor labels themselves are handled globally by LF.init.cursor (lf-chrome.js)
    // via [data-cursor] — nothing further needed here beyond marking bound so
    // this init is idempotent; kept as its own function for clarity/future growth.
  };

  // ——— Draggable infinite product marquee (native Pointer Events, no Observer plugin) ———
  LF.init.marquee = function (root, ctx) {
    var wrap = (root || document).querySelector('[data-lf-marquee]');
    if (!wrap || wrap.hasAttribute('data-lf-bound')) return;
    wrap.setAttribute('data-lf-bound', '1');
    if (ctx.reduced || !window.gsap) return;
    var track = wrap.querySelector('[data-lf-marquee-track]');
    if (!track) return;
    var section = wrap.closest('.lf-marquee-section');
    // The transform-driven track has no native scroll position of its own,
    // but its overflow:hidden ancestor (which also wraps the unrelated
    // statement text as a sibling) is still a valid target for the browser's
    // native focus-scroll-into-view behavior on every Tab keystroke. Left
    // alone, that native scrollLeft adjustment fights the GSAP transform and
    // can visibly drift the statement text sideways. Snap it back to 0 so
    // the GSAP transform stays the only source of truth for position.
    if (section) {
      section.addEventListener('focusin', function () {
        if (section.scrollLeft !== 0) section.scrollLeft = 0;
      });
    }
    var half = track.scrollWidth / 2; // second half is the duplicated loop content
    var wrapFn = gsap.utils.wrap(-half, 0);
    var total = 0;
    var xTo = gsap.quickTo(track, 'x', {
      duration: .5, ease: 'power3',
      modifiers: { x: gsap.utils.unitize(wrapFn) }
    });
    var dragging = false, startX = 0, startTotal = 0, activePointer = null, lastDragDistance = 0;

    function onDown(e) {
      dragging = true; startX = e.clientX; startTotal = total; activePointer = e.pointerId;
      wrap.classList.add('is-dragging');
      // Capture on the actual event target, not `track` — capturing on an
      // ancestor disrupts the browser's native click-event synthesis for
      // the descendant that was really interacted with, suppressing
      // navigation on every click (drag or not), not just genuine drags.
      try { e.target.setPointerCapture(activePointer); } catch (err) {}
    }
    function onMove(e) {
      if (!dragging || e.pointerId !== activePointer) return;
      total = startTotal + (e.clientX - startX);
      xTo(total);
    }
    function onUp(e) {
      if (!dragging || e.pointerId !== activePointer) return;
      // Capture the drag distance BEFORE resetting `dragging` — the click
      // handler runs after pointerup in the same interaction, so checking
      // `dragging` there would always read the just-reset false value.
      lastDragDistance = Math.abs(total - startTotal);
      dragging = false;
      wrap.classList.remove('is-dragging');
      try { e.target.releasePointerCapture(activePointer); } catch (err) {}
      activePointer = null;
    }
    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onUp);
    track.addEventListener('click', function (e) {
      // A genuine drag (moved more than a few px) shouldn't navigate; a tap/
      // click that barely moved should behave like a normal link click.
      if (lastDragDistance > 6) e.preventDefault();
    });

    function tick(time, deltaTime) {
      if (!dragging) { total -= deltaTime / 20; xTo(total); }
    }
    gsap.ticker.add(tick);
    LF.teardown.push(function () { gsap.ticker.remove(tick); gsap.killTweensOf(track); });
  };

  // ——— Lookbook slider: simple crossfade + counter ———
  LF.init.lookbook = function (root, ctx) {
    var section = (root || document).querySelector('[data-lf-lookbook]');
    if (!section || section.hasAttribute('data-lf-bound')) return;
    section.setAttribute('data-lf-bound', '1');
    var slides = Array.prototype.slice.call(section.querySelectorAll('.lf-lookbook__slide'));
    var n = slides.length;
    if (n < 2) return;
    var i = 0;
    var counter = section.querySelector('[data-lf-lookbook-current]');
    function go(next) {
      slides[i].classList.remove('is-active');
      i = (next + n) % n;
      slides[i].classList.add('is-active');
      if (counter) counter.textContent = String(i + 1).padStart(2, '0');
    }
    var prevBtn = section.querySelector('[data-lf-lookbook-prev]');
    var nextBtn = section.querySelector('[data-lf-lookbook-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () { go(i - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(i + 1); });
  };

  // ——— Community section: reveal-on-scroll only (data-lf-reveal handles it), no extra JS needed ———
  LF.init.community = function (root, ctx) {
    var section = (root || document).querySelector('.lf-community');
    if (!section || section.hasAttribute('data-lf-bound')) return;
    section.setAttribute('data-lf-bound', '1');
  };

  // ——— Story hero: reading-mode hover is pure CSS (:has()); nothing to bind ———
  LF.init.storyHero = function (root, ctx) {
    var hero = (root || document).querySelector('.lf-storyhero');
    if (!hero || hero.hasAttribute('data-lf-bound')) return;
    hero.setAttribute('data-lf-bound', '1');
  };

  // ——— Overlap-scroll stitching: pinned section slides under the next as you scroll past ———
  // Desktop-only (LF.FINE, same gate as flickthrough): the yPercent:50 slide is
  // calibrated for desktop section geometry. On portrait mobile the CTA row
  // collapses to a single ~880px column, so half its height (~440px) permanently
  // buried the entire marquee beneath it — z-index:1 put the slid section on top.
  LF.init.scrollOverlap = function (root, ctx) {
    if (ctx.reduced || !window.gsap || !window.ScrollTrigger) return;
    if (!(LF.FINE && LF.FINE.matches)) return;
    (root || document).querySelectorAll('[data-lf-overlap]:not([data-lf-overlap-bound])').forEach(function (el) {
      el.setAttribute('data-lf-overlap-bound', '1');
      gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top top', end: '+=500', scrub: true, invalidateOnRefresh: true }
      // Fixed-px slide, NOT yPercent: a proportional slide re-scales whenever a
      // section's height changes (the 70svh->100svh statement grew its slide by
      // ~43% and its opaque tail sliced across the marquee's stamp line). The
      // stitch is "about 240px" by design, whatever the section's height is.
      }).to(el, { y: function () { return Math.min(el.offsetHeight * 0.5, 240); }, ease: 'power1.in' });
    });
  };

  // ——— Editorial image parallax (scrubbed to scroll) ———
  LF.init.imgScroll = function (root, ctx) {
    if (ctx.reduced || !window.gsap || !window.ScrollTrigger) return;
    (root || document).querySelectorAll('[data-lf-img-scroll]:not([data-lf-imgscroll-bound])').forEach(function (wrap) {
      wrap.setAttribute('data-lf-imgscroll-bound', '1');
      var img = wrap.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { yPercent: 0 }, {
        yPercent: 20, ease: 'linear',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  };

  // ——— Flickthrough hover zoetrope (desktop hover, mobile auto-cycle) ———
  LF.init.flickthrough = function (root, ctx) {
    var wrap = (root || document).querySelector('[data-lf-flickthrough]');
    if (!wrap || wrap.hasAttribute('data-lf-bound')) return;
    wrap.setAttribute('data-lf-bound', '1');
    var imgs = Array.prototype.slice.call(wrap.querySelectorAll('.lf-flickthrough__img'));
    if (imgs.length < 2) return;
    var index = 0, interval = null;
    function nextImage() {
      imgs[index].classList.remove('is-shown');
      index = (index + 1) % imgs.length;
      imgs[index].classList.add('is-shown');
    }
    if (ctx.reduced) return;
    if (LF.FINE.matches) {
      wrap.addEventListener('mouseenter', function () {
        nextImage();
        clearInterval(interval);
        interval = setInterval(nextImage, 300);
      });
      wrap.addEventListener('mouseleave', function () { clearInterval(interval); });
    } else {
      interval = setInterval(nextImage, 500);
    }
    LF.teardown.push(function () { clearInterval(interval); });
  };

  // ——— Sticky story stack: pure CSS position:sticky, JS only for reduced-motion no-op guard ———
  LF.init.stickyStack = function (root, ctx) {
    var stack = (root || document).querySelector('.lf-storysticky__stack');
    if (!stack || stack.hasAttribute('data-lf-bound')) return;
    stack.setAttribute('data-lf-bound', '1');
  };

  // ——— Floating crests: cycle visibility scrubbed to scroll position ———
  LF.init.floatingCrests = function (root, ctx) {
    var wrap = (root || document).querySelector('[data-lf-floating-crests]');
    if (!wrap || wrap.hasAttribute('data-lf-bound')) return;
    wrap.setAttribute('data-lf-bound', '1');
    if (ctx.reduced || !window.gsap || !window.ScrollTrigger) return;
    var crests = Array.prototype.slice.call(wrap.querySelectorAll('.lf-storysticky__crest'));
    if (crests.length < 2) return;
    var tl = gsap.timeline({
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    crests.forEach(function (c, idx) {
      tl.set(crests, {
        autoAlpha: function (i) { return i === idx ? 1 : 0; },
        overwrite: 'auto'
      }, idx / (crests.length - 1));
    });
  };

  // ——— Contact split layout: pure CSS sticky, nothing to bind beyond the idempotency guard ———
  LF.init.contactSplit = function (root, ctx) {
    var section = (root || document).querySelector('.lf-contact');
    if (!section || section.hasAttribute('data-lf-bound')) return;
    section.setAttribute('data-lf-bound', '1');
  };

  // ——— Neon flood: page floods to neon while a [data-lf-flood] section is in view ———
  // Class sits on <html> (reaches the persistent header outside the Barba
  // container), so it MUST be torn down on leave — ScrollTrigger's kill alone
  // does not remove an already-applied class.
  LF.init.flood = function (root, ctx) {
    if (ctx.reduced || !window.ScrollTrigger) return;
    var docEl = document.documentElement;
    (root || document).querySelectorAll('[data-lf-flood]:not([data-lf-flood-bound])').forEach(function (el) {
      el.setAttribute('data-lf-flood-bound', '1');
      ScrollTrigger.create({
        trigger: el, start: 'top 60%', end: 'bottom 40%',
        onEnter: function () { docEl.classList.add('lf-flood'); },
        onEnterBack: function () { docEl.classList.add('lf-flood'); },
        onLeave: function () { docEl.classList.remove('lf-flood'); },
        onLeaveBack: function () { docEl.classList.remove('lf-flood'); }
      });
      LF.teardown.push(function () { docEl.classList.remove('lf-flood'); });
    });
  };
})();

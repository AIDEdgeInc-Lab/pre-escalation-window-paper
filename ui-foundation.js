/* AID Edge Research UI foundation (docs/ui/BRIEF.md section 4). Same-origin script (CSP script-src 'self').
   1. Header hairline after 8px of scroll.  2. Section reveal (400ms, once); content is visible if this fails. */
(function () {
  // Site header: scroll hairline, mobile menu (44px toggle, panel), one dropdown model (click / Escape / outside click).
  var site = document.querySelector('.site-header');
  if (site) {
    var onSiteScroll = function () { site.classList.toggle('is-scrolled', window.scrollY > 8); };
    onSiteScroll();
    window.addEventListener('scroll', onSiteScroll, { passive: true });
    var toggle = site.querySelector('#navToggle');
    var nav = site.querySelector('#primaryNav');
    var drops = Array.prototype.slice.call(site.querySelectorAll('.has-dropdown'));
    var closeDrops = function (except) {
      drops.forEach(function (d) {
        if (d === except) return;
        d.classList.remove('dropdown-open');
        d.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
      });
    };
    var closeNav = function () {
      if (!nav) return;
      nav.classList.remove('nav-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      closeDrops();
    };
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) closeDrops();
      });
    }
    drops.forEach(function (d) {
      var t = d.querySelector('.nav-dropdown-trigger');
      t.addEventListener('click', function (e) {
        e.stopPropagation();
        var was = d.classList.contains('dropdown-open');
        closeDrops(d);
        d.classList.toggle('dropdown-open', !was);
        t.setAttribute('aria-expanded', was ? 'false' : 'true');
      });
    });
    document.addEventListener('click', function (e) { if (!site.contains(e.target)) closeNav(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openDrop = site.querySelector('.has-dropdown.dropdown-open');
      var t = openDrop && openDrop.querySelector('.nav-dropdown-trigger');
      closeNav();
      if (t) t.focus(); else if (toggle) toggle.focus();
    });
  }

  var bar = document.querySelector('.topbar');
  if (bar) {
    var update = function () { bar.classList.toggle('is-scrolled', window.scrollY > 8); };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;
  var items = document.querySelectorAll('main section, .method-section, .updates, .links');
  if (!items.length) return;
  document.documentElement.classList.add('js');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
  items.forEach(function (el) { el.setAttribute('data-reveal', ''); io.observe(el); });
})();

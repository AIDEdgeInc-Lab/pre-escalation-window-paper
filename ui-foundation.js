/* AID Edge Research UI foundation (docs/ui/BRIEF.md section 4). Same-origin script (CSP script-src 'self').
   1. Header hairline after 8px of scroll.  2. Section reveal (400ms, once); content is visible if this fails. */
(function () {
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

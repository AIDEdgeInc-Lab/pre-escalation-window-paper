/* Header hairline after 8px of scroll (docs/ui/BRIEF.md section 4). Same-origin script (CSP script-src 'self'). */
(function () {
  var bar = document.querySelector('.topbar');
  if (!bar) return;
  function update() { bar.classList.toggle('is-scrolled', window.scrollY > 8); }
  update();
  window.addEventListener('scroll', update, { passive: true });
})();

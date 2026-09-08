/* Morghew — shared JavaScript */

/* Scroll reveal */
(function() {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(function(el) { observer.observe(el); });
})();

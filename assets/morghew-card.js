(function () {
  if (window.__morghewCardBound) return;
  window.__morghewCardBound = true;

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-card-add]');
    if (!btn || btn.disabled || btn.classList.contains('is-loading')) return;
    e.preventDefault();

    var id = parseInt(btn.dataset.cardAdd, 10);
    if (!id) return;

    var drawer = document.querySelector('cart-drawer');
    var body = { items: [{ id: id, quantity: 1 }] };
    if (drawer && drawer.getSectionsToRender) {
      body.sections = drawer.getSectionsToRender().map(function (s) { return s.id; });
      body.sections_url = window.location.pathname;
    }

    btn.classList.add('is-loading');
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (state) {
        btn.classList.remove('is-loading');

        var label = btn.querySelector('.mcard__btn-label');
        if (label && !btn.dataset.added) {
          btn.dataset.added = '1';
          btn.dataset.orig = label.innerHTML;
          label.textContent = '✓ Added';
          btn.classList.add('is-added');
          setTimeout(function () {
            if (btn.dataset.orig != null) label.innerHTML = btn.dataset.orig;
            btn.classList.remove('is-added');
            delete btn.dataset.added;
            delete btn.dataset.orig;
          }, 1600);
        }

        if (drawer && drawer.renderContents) {
          if (drawer.classList.contains('is-empty')) drawer.classList.remove('is-empty');
          drawer.renderContents(state);
        } else {
          window.location = '/cart';
        }
      })
      .catch(function () { btn.classList.remove('is-loading'); });
  });
})();

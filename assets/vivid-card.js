(function () {
  if (window.__vividCardBound) return;
  window.__vividCardBound = true;

  function mainForm(btn) {
    var scope = btn.closest('.shopify-section') || document;
    var found = null;
    [scope, document].some(function (root) {
      return Array.prototype.some.call(root.querySelectorAll('form[action*="/cart/add"]'), function (f) {
        var id = f.querySelector('[name="id"]');
        if (id && id.value && !id.disabled) { found = f; return true; }
        return false;
      });
    });
    return found;
  }

  function flash(btn, text, cls) {
    var label = btn.querySelector('.mcard__btn-label');
    if (!label || btn.dataset.added) return;
    btn.dataset.added = '1';
    btn.dataset.orig = label.innerHTML;
    label.textContent = text;
    btn.classList.add(cls);
    setTimeout(function () {
      if (btn.dataset.orig != null) label.innerHTML = btn.dataset.orig;
      btn.classList.remove(cls);
      delete btn.dataset.added;
      delete btn.dataset.orig;
    }, 1800);
  }

  function addItems(btn, items) {
    var drawer = document.querySelector('cart-drawer');
    var body = { items: items };
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
        if (state && state.status && state.status >= 400) { flash(btn, 'Not available', 'is-error'); return; }

        flash(btn, '✓ Added', 'is-added');

        if (drawer && drawer.renderContents) {
          if (drawer.classList.contains('is-empty')) drawer.classList.remove('is-empty');
          drawer.renderContents(state);
        } else {
          window.location = '/cart';
        }
      })
      .catch(function () { btn.classList.remove('is-loading'); });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-card-add], [data-card-both]');
    if (!btn || btn.disabled || btn.classList.contains('is-loading')) return;
    e.preventDefault();

    if (btn.hasAttribute('data-card-both')) {
      var driverId = parseInt(btn.dataset.cardBoth, 10);
      var form = mainForm(btn);
      if (!driverId || !form) return;
      var mainId = parseInt(form.querySelector('[name="id"]').value, 10);
      var q = form.querySelector('[name="quantity"]');
      var qty = Math.max(1, parseInt(q && q.value, 10) || 1);
      if (!mainId) return;
      var items = [{ id: mainId, quantity: qty }];
      var dq = driverId === mainId ? 0 : Math.max(1, parseInt(btn.dataset.qty, 10) || 1);
      if (dq) items.push({ id: driverId, quantity: dq });
      addItems(btn, items);
      return;
    }

    var id = parseInt(btn.dataset.cardAdd, 10);
    if (!id) return;
    addItems(btn, [{ id: id, quantity: Math.max(1, parseInt(btn.dataset.qty, 10) || 1) }]);
  });
})();

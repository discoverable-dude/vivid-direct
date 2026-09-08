(function () {

  // Global in-flight lock — only one cart mutation at a time.
  var busy = false;
  function lock() {
    if (busy) return false;
    busy = true;
    return true;
  }

  // ── Loading UI ──────────────────────────────────────────────
  // Show a spinner on the affected row + the order summary (which
  // recalculates) the instant a click lands, so the wait before the
  // page reload never looks like a dead button.
  function startLoading(row) {
    if (row) row.classList.add('is-loading');
    var summary = document.querySelector('.crate-summary');
    if (summary) summary.classList.add('is-loading');
    document.body.classList.add('crate-busy');
  }
  function stopLoading(row) {
    if (row) row.classList.remove('is-loading');
    var summary = document.querySelector('.crate-summary');
    if (summary) summary.classList.remove('is-loading');
    document.body.classList.remove('crate-busy');
  }

  // ── Toast (graceful error surface, e.g. "sold out") ─────────
  var toastTimer;
  function showToast(message) {
    var t = document.getElementById('crate-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'crate-toast';
      t.className = 'crate-toast';
      document.body.appendChild(t);
    }
    t.textContent = message;
    // force reflow so the transition replays on repeated errors
    void t.offsetWidth;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 4000);
  }

  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) {
        return r.json().then(function (err) {
          console.error('[morghew-cart] API ' + r.status + ' from ' + url + ': ' + JSON.stringify(err));
          var e = new Error(err.description || err.message || ('Error ' + r.status));
          e.status = r.status;
          throw e;
        });
      }
      return r.json();
    });
  }

  function getCart() {
    return fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); });
  }

  // Shared failure handler: stop spinner, release lock, show message.
  function fail(context, row, err) {
    console.error('[morghew-cart] ' + context + ' failed:', err);
    busy = false;
    stopLoading(row);
    showToast(err && err.message ? err.message : 'Something went wrong. Please try again.');
  }

  // ── Quantity steppers ──
  document.querySelectorAll('.crate-qty__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!lock()) return;
      var qtyEl = btn.closest('.crate-qty');
      var row   = btn.closest('.crate-row');
      var vid   = String(qtyEl.dataset.vid);
      var val   = parseInt(qtyEl.querySelector('.crate-qty__val').textContent, 10);
      var qty   = btn.dataset.action === 'minus' ? Math.max(0, val - 1) : val + 1;
      startLoading(row);
      getCart()
        .then(function (cart) {
          var item = cart.items.find(function (i) { return String(i.variant_id) === vid; });
          if (!item) throw new Error('That item is no longer in your basket.');
          console.log('[morghew-cart] changing qty for key:', item.key, '→', qty);
          return post('/cart/change.js', { id: item.key, quantity: qty });
        })
        .then(function () { location.reload(); })
        .catch(function (err) { fail('qty change', row, err); });
    });
  });

  // ── Remove buttons ──
  document.querySelectorAll('.crate-row__remove').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!lock()) return;
      var row = btn.closest('.crate-row');
      var vid = String(btn.dataset.vid);
      startLoading(row);
      getCart()
        .then(function (cart) {
          var item = cart.items.find(function (i) { return String(i.variant_id) === vid; });
          if (!item) throw new Error('That item is no longer in your basket.');
          return post('/cart/change.js', { id: item.key, quantity: 0 });
        })
        .then(function () { location.reload(); })
        .catch(function (err) { fail('remove', row, err); });
    });
  });

  // ── Variant switcher ──
  document.querySelectorAll('.crate-vtile').forEach(function (tile) {
    tile.addEventListener('click', function () {
      if (tile.classList.contains('is-active') || tile.disabled) return;
      if (!lock()) return;
      var cont   = tile.closest('.crate-vtiles');
      var row    = tile.closest('.crate-row');
      var vid    = String(cont.dataset.vid);
      var qty    = parseInt(cont.dataset.qty, 10);
      var newVid = parseInt(tile.dataset.vid, 10);
      startLoading(row);
      getCart()
        .then(function (cart) {
          var item = cart.items.find(function (i) { return String(i.variant_id) === vid; });
          if (!item) throw new Error('That item is no longer in your basket.');
          return post('/cart/change.js', { id: item.key, quantity: 0 });
        })
        .then(function () { return post('/cart/add.js', { id: newVid, quantity: qty }); })
        .then(function () { location.reload(); })
        .catch(function (err) { fail('variant switch', row, err); });
    });
  });

  // ── Quick-add (Pairs Well With) ──
  document.querySelectorAll('[data-quick-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!lock()) return;
      var card = btn.closest('.crate-card') || btn;
      var vid  = parseInt(btn.dataset.quickAdd, 10);
      btn.classList.add('is-loading');
      startLoading(null);
      post('/cart/add.js', { id: vid, quantity: 1 })
        .then(function () { location.reload(); })
        .catch(function (err) {
          btn.classList.remove('is-loading');
          fail('quick-add', null, err);
        });
    });
  });

})();

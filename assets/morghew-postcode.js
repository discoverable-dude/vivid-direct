/* Morghew — postcode gate for delivery-restricted products (logs) +
   automatic delivery-charge product reconcile.
   Config comes from the DOM: [data-postcode-gate] on the product page
   (rendered by product-estate when the product carries the gate tag), and
   hidden [data-charge-add]/[data-charge-remove] markers rendered by
   snippets/cart-upsell.liquid whenever the basket state needs the charge
   product added or removed. */
(function () {
  if (window.__morghewPostcodeBound) return;
  window.__morghewPostcodeBound = true;

  function norm(v) {
    return (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /* ── product-page gate ── */
  function initGate() {
    var gate = document.querySelector('[data-postcode-gate]');
    if (!gate || gate.dataset.bound) return;
    gate.dataset.bound = '1';

    var token = gate.dataset.mapboxToken || '';
    var farmPc = norm(gate.dataset.farm || 'TN307LR');
    var maxMiles = parseFloat(gate.dataset.maxMiles) || 20;

    /* offline fallback table: "TN30=3, TN17=8" → { TN30: 3 } (road miles) */
    var table = {};
    (gate.dataset.districts || '').toUpperCase().split(',').forEach(function (entry) {
      var kv = entry.split('=');
      if (kv.length !== 2) return;
      var k = kv[0].replace(/[^A-Z0-9]/g, '');
      var mi = parseFloat(kv[1]);
      if (k && mi > 0) table[k] = mi;
    });
    if (!token && !Object.keys(table).length) return;

    /* delivery charge: £1.50/mile up to 8, £3/mile miles 9-16, £6/mile beyond */
    function chargeFor(miles) {
      if (miles <= 8) return miles * 1.5;
      if (miles <= 16) return 12 + (miles - 8) * 3;
      return 36 + (miles - 16) * 6;
    }
    function fmt(p) {
      return '£' + (p % 1 ? p.toFixed(2) : p.toFixed(0));
    }

    var input = gate.querySelector('[data-gate-input]');
    var priceEl = gate.querySelector('[data-gate-price]');
    var form = gate.closest('form');
    var btn = form && form.querySelector('button[name="add"]');
    if (!input || !btn) return;

    /* Arrived from a collection card's "Check delivery" link (quick-add is
       disabled for gated products there, since it can't collect a postcode) -
       bring the visitor straight to the field instead of leaving them to
       find it on the page themselves. */
    if (/(?:^|[?&])check_postcode=1(?:&|$)/.test(window.location.search)) {
      gate.scrollIntoView({ block: 'center', behavior: 'smooth' });
      input.focus({ preventScroll: true });
    }

    function setState(cls) {
      gate.classList.remove('is-ok', 'is-bad', 'is-checking', 'is-error');
      if (cls) gate.classList.add(cls);
    }

    function geocode(pc) {
      return fetch('https://api.postcodes.io/postcodes/' + encodeURIComponent(pc))
        .then(function (r) {
          if (r.status === 404) throw 'invalid';
          if (!r.ok) throw 'api';
          return r.json();
        })
        .then(function (j) {
          if (!j.result || j.result.longitude == null) throw 'invalid';
          return [j.result.longitude, j.result.latitude];
        });
    }

    function drive(from, to) {
      var url = 'https://api.mapbox.com/directions/v5/mapbox/driving/'
        + from[0] + ',' + from[1] + ';' + to[0] + ',' + to[1]
        + '?overview=false&access_token=' + encodeURIComponent(token);
      return fetch(url)
        .then(function (r) { if (!r.ok) throw 'api'; return r.json(); })
        .then(function (j) {
          if (!j.routes || !j.routes[0]) throw 'api';
          return j.routes[0].distance / 1609.344;
        });
    }

    var farmCoords = null;
    function getFarm() {
      if (farmCoords) return Promise.resolve(farmCoords);
      try {
        var c = sessionStorage.getItem('mgateFarm');
        if (c) { farmCoords = JSON.parse(c); return Promise.resolve(farmCoords); }
      } catch (e) {}
      return geocode(farmPc).then(function (c) {
        farmCoords = c;
        try { sessionStorage.setItem('mgateFarm', JSON.stringify(c)); } catch (e) {}
        return c;
      });
    }

    function accept(mi) {
      var price = chargeFor(mi);
      if (priceEl) priceEl.textContent = fmt(price);
      setState('is-ok');
      btn.disabled = false;
      var pc = input.value.trim().toUpperCase();
      try { sessionStorage.setItem('morghewPostcode', pc); } catch (e) {}
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: {
          'Delivery postcode (logs)': pc,
          'Log delivery miles': String(mi),
          'Log delivery charge': String(Math.round(price * 100))
        } })
      }).catch(function () {});
    }

    var seq = 0;
    function evaluate() {
      var pc = norm(input.value);
      btn.disabled = true;
      if (pc.length < 5) { setState(null); return; }
      var mySeq = ++seq;
      setState('is-checking');
      var run = token
        ? Promise.all([getFarm(), geocode(pc)]).then(function (res) { return drive(res[0], res[1]); })
        : Promise.reject('api');
      run
        .then(function (miles) {
          if (mySeq !== seq) return;
          var mi = Math.max(1, Math.round(miles));
          if (mi > maxMiles) { setState('is-bad'); return; }
          accept(mi);
        })
        .catch(function (err) {
          if (mySeq !== seq) return;
          if (err === 'invalid') { setState('is-bad'); return; }
          /* distance service unreachable → offline district table */
          var out = pc.slice(0, -3);
          if (out in table) { accept(Math.round(table[out])); }
          else setState('is-error');
        });
    }

    var debounce;
    input.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(evaluate, 450);
    });
    var saved = '';
    try { saved = sessionStorage.getItem('morghewPostcode') || ''; } catch (e) {}
    if (saved && !input.value) input.value = saved;
    evaluate();
  }

  /* ── delivery-charge reconcile ── */
  function refresh(sectionsState) {
    var drawer = document.querySelector('cart-drawer');
    if (sectionsState && drawer && drawer.renderContents) {
      drawer.renderContents(sectionsState);
      return;
    }
    if (window.location.pathname.indexOf('/cart') === 0) window.location.reload();
  }

  function reconcile() {
    var add = document.querySelector('[data-charge-add]');
    var rem = document.querySelector('[data-charge-remove]');
    if (!add && !rem) {
      try {
        Object.keys(sessionStorage).forEach(function (k) {
          if (k.indexOf('mchg-') === 0) sessionStorage.removeItem(k);
        });
      } catch (e) {}
      return;
    }

    var el = add || rem;
    var vid = parseInt(add ? add.dataset.chargeAdd : rem.dataset.chargeRemove, 10);
    if (!vid) return;

    var flag = 'mchg-' + vid + '-' + (add ? 'a' : 'r');
    try {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, '1');
    } catch (e) {}
    el.removeAttribute(add ? 'data-charge-add' : 'data-charge-remove');

    var drawer = document.querySelector('cart-drawer');
    var url = add ? '/cart/add.js' : '/cart/change.js';
    var body;
    if (add) {
      var qty = parseInt(add.dataset.chargeQty || '1', 10) || 1;
      var line = { id: vid, quantity: qty };
      if (add.dataset.chargeMiles) line.properties = { Distance: add.dataset.chargeMiles + ' miles' };
      body = { items: [line] };
    } else {
      body = { id: vid, quantity: 0 };
    }
    if (drawer && drawer.getSectionsToRender) {
      body.sections = drawer.getSectionsToRender().map(function (s) { return s.id; });
      body.sections_url = window.location.pathname;
    }

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (s) {
        try { sessionStorage.removeItem(flag); } catch (e) {}
        refresh(s);
      })
      .catch(function () {});
  }

  /* markers and gates can (re)appear whenever the drawer re-renders */
  var mo = new MutationObserver(function () {
    reconcile();
    initGate();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  function boot() { initGate(); reconcile(); }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();

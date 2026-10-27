/* Branded dropdown. Enhances <select data-vselect>; the native select stays in the DOM (hidden) as the source of truth. */
(function () {
  if (window.__vividSelectBound) return;
  window.__vividSelectBound = true;
  var uid = 0;

  function enhance(sel) {
    if (sel.__vs) return; sel.__vs = true;
    var id = 'vs' + (++uid);
    var wrap = document.createElement('div'); wrap.className = 'vselect';
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'vselect__btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    var label = sel.getAttribute('aria-label') || (sel.closest('label') && sel.closest('label').textContent.trim()) || '';
    if (label) btn.setAttribute('aria-label', label);
    var val = document.createElement('span'); val.className = 'vselect__val';
    var chev = document.createElement('span'); chev.className = 'vselect__chev'; chev.setAttribute('aria-hidden', 'true');
    btn.appendChild(val); btn.appendChild(chev);
    var list = document.createElement('ul'); list.className = 'vselect__list'; list.id = id; list.setAttribute('role', 'listbox'); list.tabIndex = -1; list.hidden = true;
    btn.setAttribute('aria-controls', id);
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(btn); wrap.appendChild(list); wrap.appendChild(sel);
    sel.classList.add('vselect__native'); sel.setAttribute('tabindex', '-1'); sel.setAttribute('aria-hidden', 'true');
    var active = -1, typed = '', typedAt = 0;

    function opts() { return Array.prototype.slice.call(list.children); }
    function build() {
      list.innerHTML = '';
      Array.prototype.forEach.call(sel.options, function (o, i) {
        var li = document.createElement('li'); li.className = 'vselect__opt'; li.setAttribute('role', 'option'); li.id = id + '-' + i;
        li.dataset.value = o.value; li.textContent = o.textContent; list.appendChild(li);
      });
      sync();
    }
    function sync() {
      var o = sel.options[sel.selectedIndex];
      val.textContent = o ? o.textContent : '';
      opts().forEach(function (li, i) { var on = i === sel.selectedIndex; li.setAttribute('aria-selected', on ? 'true' : 'false'); li.classList.toggle('is-on', on); });
      wrap.classList.toggle('is-single', sel.options.length < 2);
      btn.disabled = sel.options.length < 2;
    }
    function setActive(i) {
      var items = opts(); if (!items.length) return;
      active = Math.max(0, Math.min(items.length - 1, i));
      items.forEach(function (li, k) { li.classList.toggle('is-active', k === active); });
      list.setAttribute('aria-activedescendant', items[active].id);
      var li = items[active];
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
    }
    function open() {
      if (btn.disabled) return;
      list.hidden = false; wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      var r = btn.getBoundingClientRect();
      wrap.classList.toggle('is-up', window.innerHeight - r.bottom < 260 && r.top > 260);
      setActive(sel.selectedIndex < 0 ? 0 : sel.selectedIndex); list.focus({ preventScroll: true });
    }
    function close(refocus) {
      list.hidden = true; wrap.classList.remove('is-open', 'is-up'); btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus({ preventScroll: true });
    }
    function choose(i) {
      if (i < 0 || i >= sel.options.length) return;
      var changed = sel.selectedIndex !== i; sel.selectedIndex = i; sync(); close(true);
      if (changed) sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    btn.addEventListener('click', function () { list.hidden ? open() : close(false); });
    btn.addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].indexOf(e.key) > -1) { e.preventDefault(); open(); }
    });
    list.addEventListener('click', function (e) { var li = e.target.closest('.vselect__opt'); if (li) choose(opts().indexOf(li)); });
    list.addEventListener('mousemove', function (e) { var li = e.target.closest('.vselect__opt'); if (li) { var i = opts().indexOf(li); if (i !== active) setActive(i); } });
    list.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (k === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (k === 'Home') { e.preventDefault(); setActive(0); }
      else if (k === 'End') { e.preventDefault(); setActive(opts().length - 1); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active); }
      else if (k === 'Escape') { e.preventDefault(); close(true); }
      else if (k === 'Tab') { close(false); }
      else if (k.length === 1) {
        var now = Date.now(); typed = (now - typedAt > 700 ? '' : typed) + k.toLowerCase(); typedAt = now;
        var hit = opts().findIndex(function (li) { return li.textContent.toLowerCase().indexOf(typed) === 0; });
        if (hit > -1) setActive(hit);
      }
    });
    document.addEventListener('click', function (e) { if (!list.hidden && !wrap.contains(e.target)) close(false); });
    sel.addEventListener('change', sync);
    new MutationObserver(build).observe(sel, { childList: true });
    build();
  }

  function init() { document.querySelectorAll('select[data-vselect]').forEach(enhance); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  new MutationObserver(init).observe(document.documentElement, { childList: true, subtree: true });
})();

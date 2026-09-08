/* morghew-lightbox.js — click-to-zoom for product gallery images.
   Any [data-zoomable] image opens a full-screen overlay of its current src.
   Close: Esc, click backdrop, or the close button. Focus returns to the trigger. */
(function () {
  'use strict';
  var overlay = null;
  var lastFocus = null;

  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  function close() {
    if (!overlay) return;
    document.removeEventListener('keydown', onKey);
    document.documentElement.style.overflow = '';
    overlay.remove();
    overlay = null;
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function open(src, alt) {
    if (!src) return;
    overlay = document.createElement('div');
    overlay.className = 'mlb';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', alt || 'Product image');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mlb__close';
    btn.setAttribute('aria-label', 'Close image');
    btn.innerHTML = '&times;';

    var img = document.createElement('img');
    img.className = 'mlb__img';
    img.src = src;
    img.alt = alt || '';

    overlay.appendChild(btn);
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = 'hidden';
    btn.focus();

    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === btn) close();
    });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-zoomable]');
    if (!trigger) return;
    lastFocus = trigger;
    open(trigger.currentSrc || trigger.src, trigger.alt);
  });
})();

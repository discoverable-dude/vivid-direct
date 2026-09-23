// Vivid Form — multi-step wizard behaviour.
// The form is a single native <form> that always posts all fields at once;
// this script only controls which .m-form__step is visible at a time and
// gates "Next" on the visible step's own validity, since browsers skip
// required-field validation on inputs that are display:none.
(function () {
  function initForm(form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll('.m-form__step'));
    var nav = form.querySelector('[data-form-stepnav]');
    if (!steps.length || !nav) return;

    var dots = Array.prototype.slice.call(nav.querySelectorAll('[data-dot]'));
    var backBtn = nav.querySelector('[data-form-back]');
    var nextBtn = nav.querySelector('[data-form-next]');
    var submitBtn = nav.querySelector('[data-form-submit]');
    var current = 0;

    function render() {
      steps.forEach(function (step, i) {
        step.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
        dot.classList.toggle('is-done', i < current);
      });
      backBtn.hidden = current === 0;
      var isLast = current === steps.length - 1;
      nextBtn.hidden = isLast;
      submitBtn.hidden = !isLast;
      steps[current].querySelector('input, select, textarea')?.focus({ preventScroll: true });
      nav.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function currentStepIsValid() {
      var fields = steps[current].querySelectorAll('input, select, textarea');
      var valid = true;
      fields.forEach(function (field) {
        if (!field.checkValidity()) {
          field.reportValidity();
          valid = false;
        }
      });
      return valid;
    }

    nextBtn.addEventListener('click', function () {
      if (!currentStepIsValid()) return;
      if (current < steps.length - 1) {
        current += 1;
        render();
      }
    });

    backBtn.addEventListener('click', function () {
      if (current > 0) {
        current -= 1;
        render();
      }
    });

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        if (i < current) {
          current = i;
          render();
        }
      });
      dot.style.cursor = 'pointer';
    });

    render();
  }

  function init() {
    document.querySelectorAll('.m-form__form:has([data-form-multi-step])').forEach(initForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

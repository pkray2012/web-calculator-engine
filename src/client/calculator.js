/**
 * Generic browser controller for calculator pages.
 * Reads the form, runs the page's adapter (which calls the engine), and
 * re-renders with the same components used at build time. No calculation
 * logic lives here.
 *
 * Page markup contract (see src/pages/*): #calc-form, #calc-form-errors,
 * #calc-results[data-state], #results-status, #calc-results-body,
 * #calc-announcer and #quick-result.
 */

import { errorSummary } from '../components/fields.js';

const INPUT_DEBOUNCE_MS = 300;

/**
 * config: {
 *   defaults: { field: string },          form field names and default values
 *   fieldIds: { field: elementId },        for error placement
 *   run(values) → { ok: true, view } | { ok: false, errors },
 *   render(view), quick(view), announce(view)   → markup / text
 * }
 */
export function mountCalculator(config) {
  const fields = Object.keys(config.defaults);
  const form = /** @type {HTMLFormElement} */ (document.getElementById('calc-form'));
  const resultsPanel = document.getElementById('calc-results');
  const resultsBody = document.getElementById('calc-results-body');
  const status = document.getElementById('results-status');
  const announcer = document.getElementById('calc-announcer');
  const errorSlot = document.getElementById('calc-form-errors');
  const quickResult = document.getElementById('quick-result');

  const control = (field) => /** @type {HTMLInputElement | HTMLSelectElement | null} */ (form.elements.namedItem(field));

  function readValues() {
    return Object.fromEntries(fields.map((field) => {
      const element = control(field);
      if (element instanceof HTMLInputElement && element.type === 'checkbox') return [field, element.checked ? 'on' : ''];
      return [field, element ? String(element.value) : ''];
    }));
  }

  function writeValues(values) {
    for (const field of fields) {
      const element = control(field);
      if (!element || values[field] === undefined) continue;
      if (element instanceof HTMLInputElement && element.type === 'checkbox') element.checked = values[field] === 'on';
      else element.value = values[field];
    }
  }

  function setFieldError(field, message) {
    const id = config.fieldIds[field];
    if (!id) return;
    const input = document.getElementById(id);
    const container = form.querySelector(`[data-field="${id}"]`);
    const slot = document.getElementById(`${id}-error`);
    if (!input || !container || !slot) return;
    slot.textContent = message ?? '';
    slot.hidden = !message;
    container.classList.toggle('field--invalid', Boolean(message));
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  /**
   * mode "all" shows every error; "clear-only" removes errors that are fixed.
   * New errors appear only on submit: showing them on blur shifts the layout
   * between mousedown and mouseup and makes the Calculate click miss.
   */
  function applyErrors(errors, mode) {
    for (const field of fields) {
      if (errors[field] && mode === 'all') setFieldError(field, errors[field]);
      if (!errors[field]) setFieldError(field, null);
    }
  }

  function showSummary(errors) {
    errorSlot.innerHTML = String(errorSummary(errors, config.fieldIds));
    const summary = /** @type {HTMLElement | null} */ (errorSlot.firstElementChild);
    if (summary) summary.focus();
  }

  function syncUrl(values) {
    const params = new URLSearchParams();
    for (const field of fields) {
      if (values[field] !== config.defaults[field]) params.set(field, values[field]);
    }
    const query = params.toString();
    history.replaceState(null, '', query ? `?${query}` : location.pathname);
  }

  function markStale(errors) {
    const messages = Object.values(errors);
    resultsPanel.dataset.state = 'stale';
    quickResult.hidden = true;
    status.textContent = `These results are out of date. ${messages[0]}${messages.length > 1 ? ` (+${messages.length - 1} more)` : ''}`;
  }

  /** trigger: "input" (while typing), "submit" or "load". */
  function update(trigger) {
    const values = readValues();
    const result = config.run(values);

    if (!result.ok) {
      applyErrors(result.errors, trigger === 'input' ? 'clear-only' : 'all');
      if (trigger !== 'input') showSummary(result.errors);
      markStale(result.errors);
      return;
    }

    applyErrors({}, 'clear-only');
    errorSlot.innerHTML = '';

    const { view } = result;
    resultsBody.innerHTML = String(config.render(view));
    quickResult.innerHTML = String(config.quick(view));
    quickResult.hidden = false;
    resultsPanel.dataset.state = 'current';
    status.textContent = 'Results for your inputs.';
    syncUrl(values);

    if (trigger !== 'input') announcer.textContent = config.announce(view);
    if (trigger === 'submit') {
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      status.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      status.focus({ preventScroll: true });
    }
  }

  let timer;
  form.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => update('input'), INPUT_DEBOUNCE_MS);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTimeout(timer);
    update('submit');
  });

  // Shared links (?field=…) restore a calculation. Unchecked boxes are
  // omitted from a shared link only when their default is also unchecked.
  const params = new URLSearchParams(location.search);
  if (fields.some((field) => params.has(field))) {
    const fromUrl = Object.fromEntries(fields.filter((field) => params.has(field)).map((field) => [field, params.get(field)]));
    writeValues({ ...config.defaults, ...fromUrl });
    update('load');
  }
}

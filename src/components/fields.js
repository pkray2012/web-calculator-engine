/**
 * Accessible form-field markup shared by calculator pages.
 * Every field has a visible <label>, an optional hint and an error slot,
 * both wired through aria-describedby so screen readers announce them.
 */

import { html } from '../lib/html.js';

function describedBy(id, hint) {
  return [hint ? `${id}-hint` : null, `${id}-error`].filter(Boolean).join(' ');
}

function fieldShell({ id, label, hint = null, optional = false, error = null, control }) {
  return html`<div class="field${error ? ' field--invalid' : ''}" data-field="${id}">
  <label for="${id}">${label}${optional ? html` <span class="field__optional">(optional)</span>` : ''}</label>
  ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
  ${control}
  <p class="field__error" id="${id}-error"${error ? '' : ' hidden'}>${error ?? ''}</p>
</div>`;
}

/**
 * Numeric text input. type="text" + inputmode avoids browser number-input
 * quirks (scroll-to-change, locale commas) while keeping a numeric keypad.
 */
export function numberField({ id, name, label, value, hint = null, prefix = null, suffix = null, optional = false, error = null, inputmode = 'decimal' }) {
  const control = html`<div class="input${prefix ? ' input--prefix' : ''}${suffix ? ' input--suffix' : ''}">
    ${prefix ? html`<span class="input__affix" aria-hidden="true">${prefix}</span>` : ''}
    <input id="${id}" name="${name}" type="text" inputmode="${inputmode}" autocomplete="off" spellcheck="false"
      value="${value}" aria-describedby="${describedBy(id, hint)}"${error ? html` aria-invalid="true"` : ''}${optional ? '' : ' required'}>
    ${suffix ? html`<span class="input__affix" aria-hidden="true">${suffix}</span>` : ''}
  </div>`;
  return fieldShell({ id, label, hint, optional, error, control });
}

export function monthField({ id, name, label, value, hint = null, optional = true, error = null }) {
  const control = html`<div class="input">
    <input id="${id}" name="${name}" type="month" value="${value}" aria-describedby="${describedBy(id, hint)}"${error ? html` aria-invalid="true"` : ''}>
  </div>`;
  return fieldShell({ id, label, hint, optional, error, control });
}

/** A native time input (value "HH:MM", 24-hour) with a short visible label. */
export function timeField({ id, name, label, value, error = null }) {
  return html`<div class="time-cell${error ? ' field--invalid' : ''}" data-field="${id}">
  <label for="${id}">${label}</label>
  <div class="input"><input id="${id}" name="${name}" type="time" step="60" value="${value}" aria-describedby="${id}-error"${error ? html` aria-invalid="true"` : ''}></div>
  <p class="field__error" id="${id}-error"${error ? '' : ' hidden'}>${error ?? ''}</p>
</div>`;
}

/** A number input paired with a unit <select>, grouped in a fieldset. */
export function amountWithUnitField({ id, name, unitName, legend, value, unit, units, hint = null, error = null }) {
  return html`<fieldset class="field field--group${error ? ' field--invalid' : ''}" data-field="${id}">
  <legend>${legend}</legend>
  ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
  <div class="field__row">
    <div class="input">
      <label class="visually-hidden" for="${id}">${legend} length</label>
      <input id="${id}" name="${name}" type="text" inputmode="decimal" autocomplete="off" value="${value}"
        aria-describedby="${describedBy(id, hint)}"${error ? html` aria-invalid="true"` : ''} required>
    </div>
    <label class="visually-hidden" for="${id}-unit">${legend} unit</label>
    <select id="${id}-unit" name="${unitName}">
      ${units.map((option) => html`<option value="${option.value}"${option.value === unit ? ' selected' : ''}>${option.label}</option>`)}
    </select>
  </div>
  <p class="field__error" id="${id}-error"${error ? '' : ' hidden'}>${error ?? ''}</p>
</fieldset>`;
}

/** A single checkbox with its label beside it; value "on" when checked. */
export function checkboxField({ id, name, label, checked = false, hint = null }) {
  return html`<div class="field field--checkbox" data-field="${id}">
  <div class="checkbox">
    <input id="${id}" name="${name}" type="checkbox"${checked ? html` checked` : ''}${hint ? html` aria-describedby="${id}-hint"` : ''}>
    <label for="${id}">${label}</label>
  </div>
  ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
</div>`;
}

/** A group of radio buttons in a fieldset. options: [{ value, label, id }]. */
export function radioField({ id, name, legend, value, options, hint = null }) {
  return html`<fieldset class="field field--group field--radios" data-field="${id}"${hint ? html` aria-describedby="${id}-hint"` : ''}>
  <legend>${legend}</legend>
  ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
  ${options.map((option) => html`<div class="checkbox">
    <input id="${option.id}" name="${name}" type="radio" value="${option.value}"${option.value === value ? html` checked` : ''}>
    <label for="${option.id}">${option.label}</label>
  </div>`)}
</fieldset>`;
}

/** Summary of all errors, focused on submit so keyboard users land on it. */
export function errorSummary(errors, fieldIds) {
  const entries = Object.entries(errors);
  if (!entries.length) return html``;
  return html`<div class="error-summary" role="alert" tabindex="-1">
  <h2 class="error-summary__title">Check ${entries.length === 1 ? 'this field' : `these ${entries.length} fields`}</h2>
  <ul>${entries.map(([field, message]) => html`<li><a href="#${fieldIds[field] ?? field}">${message}</a></li>`)}</ul>
</div>`;
}

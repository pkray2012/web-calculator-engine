/**
 * A required choice between radio buttons, with a hint and an error slot in
 * the same fieldset. The first radio carries the field id, so the browser
 * controller (src/client/calculator.js) can mark the group invalid and focus
 * it from the error summary. No option is preselected unless value matches.
 */

import { html } from '../../lib/html.js';

/** options: [{ value, label }]; ids are `${id}` for the first option and `${id}-${value}` for the rest. */
export function choiceField({ id, name, legend, value, options, hint = null, error = null }) {
  const describedBy = [hint ? `${id}-hint` : null, `${id}-error`].filter(Boolean).join(' ');
  return html`<fieldset class="field field--group field--radios${error ? ' field--invalid' : ''}" data-field="${id}">
  <legend>${legend}</legend>
  ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
  ${options.map((option, index) => html`<div class="checkbox">
    <input id="${index === 0 ? id : `${id}-${option.value}`}" name="${name}" type="radio" value="${option.value}" aria-describedby="${describedBy}"${option.value === value ? html` checked` : ''}${error ? html` aria-invalid="true"` : ''}>
    <label for="${index === 0 ? id : `${id}-${option.value}`}">${option.label}</label>
  </div>`)}
  <p class="field__error" id="${id}-error"${error ? '' : ' hidden'}>${error ?? ''}</p>
</fieldset>`;
}

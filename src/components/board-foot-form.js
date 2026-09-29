/**
 * Board Foot Calculator form: up to four stacks of lumber, each a compact row
 * of quantity, thickness, width and length. Rendered at build time and reused
 * by the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { BOARD_FOOT_DEFAULTS, BOARD_FOOT_ROWS } from '../adapters/board-foot.js';

const PARTS = [
  { part: 'Quantity', id: 'qty', label: 'Pieces', inputmode: 'numeric' },
  { part: 'Thickness', id: 'thick', label: 'Thick (in)', inputmode: 'text' },
  { part: 'Width', id: 'width', label: 'Wide (in)', inputmode: 'decimal' },
  { part: 'Length', id: 'len', label: 'Long (ft)', inputmode: 'decimal' }
];

export const BOARD_FOOT_FIELD_IDS = Object.freeze({
  ...Object.fromEntries(BOARD_FOOT_ROWS.flatMap((n) => PARTS.map(({ part, id }) => [`row${n}${part}`, `bf-${n}-${id}`]))),
  wastePercent: 'bf-waste',
  pricePerBoardFoot: 'bf-price'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function boardFootForm(values = BOARD_FOOT_DEFAULTS, errors = {}, quick = null) {
  const ids = BOARD_FOOT_FIELD_IDS;
  const cell = (n, { part, label, inputmode }) => {
    const name = `row${n}${part}`;
    const id = ids[name];
    const error = errors[name];
    return html`<div class="time-cell${error ? ' field--invalid' : ''}" data-field="${id}">
      <label for="${id}">${label}</label>
      <div class="input"><input id="${id}" name="${name}" type="text" inputmode="${inputmode}" autocomplete="off" value="${values[name]}" aria-describedby="${id}-error"${error ? html` aria-invalid="true"` : ''}></div>
      <p class="field__error" id="${id}-error"${error ? '' : ' hidden'}>${error ?? ''}</p>
    </div>`;
  };
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your lumber</h3>
  <p class="field__hint">Thickness in inches or quarters (4/4 = 1 in, 5/4 = 1¼ in, 8/4 = 2 in). Use nominal sizes: a 2×6 is 2 by 6. Rows 2 to 4 are optional.</p>
  ${BOARD_FOOT_ROWS.map((n) => html`<fieldset class="time-row">
    <legend>Stack ${n}${n > 1 ? html` <span class="field__optional">(optional)</span>` : ''}</legend>
    <div class="time-row__cells time-row__cells--4">${PARTS.map((part) => cell(n, part))}</div>
  </fieldset>`)}
  ${numberField({ id: ids.wastePercent, name: 'wastePercent', label: 'Extra for waste', suffix: '%', optional: true, value: values.wastePercent, error: errors.wastePercent, hint: 'For defects and offcuts; 15% to 30% is common for rough hardwood.' })}
  ${numberField({ id: ids.pricePerBoardFoot, name: 'pricePerBoardFoot', label: 'Price per board foot', prefix: '$', optional: true, value: values.pricePerBoardFoot, error: errors.pricePerBoardFoot })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

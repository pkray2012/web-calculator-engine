/**
 * BTU Calculator form. The measuring method shows only its own inputs through
 * CSS :has, so no page-specific script is needed.
 */

import { html } from '../lib/html.js';
import { numberField, radioField, checkboxField } from './fields.js';
import { BTU_DEFAULTS } from '../adapters/btu.js';

export const BTU_FIELD_IDS = Object.freeze({
  measure: 'btu-measure',
  lengthFeet: 'btu-length',
  widthFeet: 'btu-width',
  squareFeet: 'btu-area',
  sun: 'btu-sun',
  people: 'btu-people',
  kitchen: 'btu-kitchen'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function btuForm(values = BTU_DEFAULTS, errors = {}, quick = null) {
  const ids = BTU_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--btu" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">The room</h3>
  ${radioField({
    id: ids.measure, name: 'measure', legend: 'Room size', value: values.measure,
    options: [
      { value: 'dims', label: 'Length and width', id: 'btu-measure-dims' },
      { value: 'area', label: 'Square feet', id: 'btu-measure-area' }
    ]
  })}
  <div class="mode-btu-dims">
    ${field('lengthFeet', { label: 'Length', suffix: 'feet' })}
    ${field('widthFeet', { label: 'Width', suffix: 'feet' })}
  </div>
  <div class="mode-btu-area">
    ${field('squareFeet', { label: 'Area to cool', suffix: 'sq ft', hint: '100 to 1,000 square feet.' })}
  </div>
  ${radioField({
    id: ids.sun, name: 'sun', legend: 'Sun', value: values.sun,
    options: [
      { value: 'shaded', label: 'Heavily shaded', id: 'btu-sun-shaded' },
      { value: 'average', label: 'Average', id: 'btu-sun-average' },
      { value: 'sunny', label: 'Very sunny', id: 'btu-sun-sunny' }
    ]
  })}
  ${field('people', { label: 'People who regularly use the room', inputmode: 'numeric', optional: true })}
  ${checkboxField({ id: ids.kitchen, name: 'kitchen', label: 'The air conditioner will cool a kitchen', checked: values.kitchen === 'on' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

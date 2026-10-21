/**
 * Solar Price Per Watt Calculator form. Rendered at build time and reused by
 * the browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField, radioField } from '../fields.js';
import { PPW_DEFAULTS } from '../../adapters/energy/solar-price-per-watt.js';

export const PPW_FIELD_IDS = Object.freeze({
  price: 'ppw-price',
  size: 'ppw-size',
  unit: 'ppw-unit',
  incentives: 'ppw-incentives'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function ppwForm(values = PPW_DEFAULTS, errors = {}, quick = null) {
  const ids = PPW_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('price', { label: 'Installed price', prefix: '$', hint: 'The total on the quote, before any incentives.' })}
  ${field('size', { label: 'System size', hint: 'Use the DC rating on your quote (the total of the panels\' watt ratings).' })}
  ${radioField({
    id: ids.unit, name: 'unit', legend: 'Size unit', value: values.unit,
    options: [
      { value: 'kW', label: 'kW (kilowatts)', id: 'ppw-unit-kw' },
      { value: 'W', label: 'W (watts)', id: 'ppw-unit-w' }
    ]
  })}
  ${field('incentives', { label: 'Incentives received', prefix: '$', optional: true, hint: 'Rebates or other incentives that lower what you pay.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

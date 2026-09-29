/**
 * Sales Tax Calculator form: add tax, remove tax from a total, or find the
 * rate. Only the inputs for the selected mode are shown (CSS :has, no script
 * needed). Rendered at build time and reused by the browser controller for
 * field ids.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { SALES_TAX_DEFAULTS } from '../adapters/sales-tax.js';

export const SALES_TAX_FIELD_IDS = Object.freeze({
  mode: 'tax-mode',
  price: 'tax-price',
  ratePercent: 'tax-rate',
  total: 'tax-total',
  ratePrice: 'tax-rate-price',
  rateTotal: 'tax-rate-total'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function salesTaxForm(values = SALES_TAX_DEFAULTS, errors = {}, quick = null) {
  const ids = SALES_TAX_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--tax" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${radioField({
    id: ids.mode, name: 'mode', legend: 'What do you want to work out?', value: values.mode,
    options: [
      { value: 'add', label: 'Add tax to a price', id: 'tax-mode-add' },
      { value: 'remove', label: 'Take tax out of a total', id: 'tax-mode-remove' },
      { value: 'rate', label: 'Find the tax rate', id: 'tax-mode-rate' }
    ]
  })}
  <div class="mode-add">
    ${field('price', { label: 'Price before tax', prefix: '$' })}
  </div>
  <div class="mode-remove">
    ${field('total', { label: 'Total with tax', prefix: '$', hint: 'The amount paid, including sales tax.' })}
  </div>
  <div class="mode-taxrate">
    ${field('ratePercent', { label: 'Sales tax rate', suffix: '%', hint: 'The combined rate where you buy: state plus any county and city rates.' })}
  </div>
  <div class="mode-rate">
    ${field('ratePrice', { label: 'Price before tax', prefix: '$' })}
    ${field('rateTotal', { label: 'Total with tax', prefix: '$' })}
  </div>
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

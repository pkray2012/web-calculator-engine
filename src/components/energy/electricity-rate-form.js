/**
 * Electricity Rate Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { RATE_DEFAULTS } from '../../adapters/energy/electricity-rate.js';

export const RATE_FIELD_IDS = Object.freeze({
  bill: 'elrate-bill',
  kwh: 'elrate-kwh',
  fixed: 'elrate-fixed'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function rateForm(values = RATE_DEFAULTS, errors = {}, quick = null) {
  const ids = RATE_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('bill', { label: 'Bill total', prefix: '$', hint: 'The amount for the billing period, in dollars and cents.' })}
  ${field('kwh', { label: 'Electricity used', suffix: 'kWh', hint: 'The kWh billed for the same period.' })}
  ${field('fixed', { label: 'Charges to exclude', prefix: '$', optional: true, hint: 'Customer charge and other fixed amounts you want left out.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

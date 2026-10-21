/**
 * Electric Bill Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { BILL_DEFAULTS } from '../../adapters/energy/electric-bill.js';

export const BILL_FIELD_IDS = Object.freeze({
  kwh: 'bill-kwh',
  rate: 'bill-rate',
  fixed: 'bill-fixed',
  days: 'bill-days'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function billForm(values = BILL_DEFAULTS, errors = {}, quick = null) {
  const ids = BILL_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('kwh', { label: 'Electricity used', suffix: 'kWh', hint: 'From your bill or meter, for the whole billing period.' })}
  ${field('rate', { label: 'Energy rate', prefix: '$', suffix: 'per kWh', hint: 'Dollars per kWh, for example 0.16 for 16¢.' })}
  ${field('fixed', { label: 'Fixed monthly charges', prefix: '$', optional: true, hint: 'Customer or service charges. Add any taxes or fees here if you want them included.' })}
  ${field('days', { label: 'Days in billing period', suffix: 'days', inputmode: 'numeric' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

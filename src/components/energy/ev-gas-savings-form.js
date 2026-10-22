/**
 * EV Gas Savings Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { SAVINGS_DEFAULTS } from '../../adapters/energy/ev-gas-savings.js';

export const SAVINGS_FIELD_IDS = Object.freeze({
  miles: 'evgas-miles',
  kwhPer100Miles: 'evgas-kwh',
  rate: 'evgas-rate',
  mpg: 'evgas-mpg',
  pricePerGallon: 'evgas-price'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function savingsForm(values = SAVINGS_DEFAULTS, errors = {}, quick = null) {
  const ids = SAVINGS_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('miles', { label: 'Miles per year', suffix: 'miles', hint: 'All-electric miles. Plug-in hybrids that also use gasoline aren\'t covered.' })}
  ${field('kwhPer100Miles', { label: 'EV efficiency', suffix: 'kWh per 100 mi', hint: 'From the EPA label; it already includes charging losses.' })}
  ${field('rate', { label: 'Electricity rate', prefix: '$', suffix: 'per kWh', hint: 'The rate you pay for each extra kWh, not your bill\'s average.' })}
  ${field('mpg', { label: 'Gas car fuel economy', suffix: 'MPG' })}
  ${field('pricePerGallon', { label: 'Gas price', prefix: '$', suffix: 'per gallon' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

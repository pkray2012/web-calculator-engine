/**
 * Solar Payback Period Calculator form. Rendered at build time and reused by
 * the browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { PAYBACK_DEFAULTS } from '../../adapters/energy/solar-payback.js';

export const PAYBACK_FIELD_IDS = Object.freeze({
  cost: 'payback-cost',
  incentives: 'payback-incentives',
  savings: 'payback-savings',
  maintenance: 'payback-maintenance'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function paybackForm(values = PAYBACK_DEFAULTS, errors = {}, quick = null) {
  const ids = PAYBACK_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], prefix: '$', ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('cost', { label: 'Installed cost', hint: 'The total price of the system, installed.' })}
  ${field('incentives', { label: 'Incentives received', optional: true, hint: 'Rebates or other incentives that lower what you pay.' })}
  ${field('savings', { label: 'Yearly bill savings', suffix: 'a year', hint: 'How much lower your electricity bills are in a year with the system.' })}
  ${field('maintenance', { label: 'Yearly maintenance', suffix: 'a year', hint: 'Enter 0 if none.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

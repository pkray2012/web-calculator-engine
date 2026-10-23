/**
 * Solar ROI Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { ROI_DEFAULTS } from '../../adapters/energy/solar-roi.js';

export const ROI_FIELD_IDS = Object.freeze({
  cost: 'roi-cost',
  incentives: 'roi-incentives',
  savings: 'roi-savings',
  maintenance: 'roi-maintenance',
  years: 'roi-years'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function roiForm(values = ROI_DEFAULTS, errors = {}, quick = null) {
  const ids = ROI_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('cost', { label: 'Installed cost', prefix: '$', hint: 'The total price of the system, installed.' })}
  ${field('incentives', { label: 'Incentives received', prefix: '$', optional: true, hint: 'Rebates or other incentives that lower what you pay.' })}
  ${field('savings', { label: 'Yearly bill savings', prefix: '$', suffix: 'a year', hint: 'How much lower your electricity bills are in a year with the system.' })}
  ${field('maintenance', { label: 'Yearly maintenance', prefix: '$', suffix: 'a year', hint: 'Enter 0 if none.' })}
  ${field('years', { label: 'Years', suffix: 'years', inputmode: 'numeric', hint: 'The period to measure the return over: a whole number from 1 to 50.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

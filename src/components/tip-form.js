/**
 * Tip Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, checkboxField } from './fields.js';
import { TIP_DEFAULTS } from '../adapters/tip.js';

export const TIP_FIELD_IDS = Object.freeze({
  bill: 'tip-bill',
  tipPercent: 'tip-percent',
  people: 'tip-people',
  tax: 'tip-tax',
  tipOnPreTax: 'tip-pretax',
  roundUp: 'tip-round'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function tipForm(values = TIP_DEFAULTS, errors = {}, quick = null) {
  const ids = TIP_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('bill', { label: 'Bill', prefix: '$', hint: 'The total on the check.' })}
  ${field('tipPercent', { label: 'Tip', suffix: '%' })}
  ${field('people', { label: 'Split between', suffix: 'people', inputmode: 'numeric', optional: true })}
  ${checkboxField({ id: ids.roundUp, name: 'roundUp', label: 'Round each share up to a whole dollar', checked: values.roundUp === 'on' })}
  <h3 class="form-group-title">Tip before tax (optional)</h3>
  ${field('tax', { label: 'Tax on the bill', prefix: '$', optional: true, hint: 'From the check, to tip on the amount before tax.' })}
  ${checkboxField({ id: ids.tipOnPreTax, name: 'tipOnPreTax', label: 'Tip on the amount before tax', checked: values.tipOnPreTax === 'on' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

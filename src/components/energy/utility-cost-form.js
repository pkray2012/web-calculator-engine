/**
 * Utility Cost Calculator form: one optional amount per bill.
 * Rendered at build time and reused by the browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { UTILITY_DEFAULTS, UTILITY_LABELS } from '../../adapters/energy/utility-cost.js';
import { UTILITY_CATEGORIES } from '../../calculators/energy/utility-cost.js';

export const UTILITY_FIELD_IDS = Object.freeze(Object.fromEntries(UTILITY_CATEGORIES.map((category) => [category, `utility-${category}`])));

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function utilityForm(values = UTILITY_DEFAULTS, errors = {}, quick = null) {
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <p class="field__hint">This month's bills. Leave out any you don't pay.</p>
  ${UTILITY_CATEGORIES.map((category) => numberField({
    id: UTILITY_FIELD_IDS[category], name: category, label: UTILITY_LABELS[category], value: values[category], error: errors[category],
    prefix: '$', suffix: 'a month', optional: true
  }))}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

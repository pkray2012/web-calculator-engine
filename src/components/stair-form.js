/**
 * Stair Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { STAIR_DEFAULTS } from '../adapters/stair.js';

export const STAIR_FIELD_IDS = Object.freeze({
  totalRise: 'stair-rise',
  treadDepth: 'stair-tread',
  treadThickness: 'stair-thickness',
  risers: 'stair-risers',
  maxRiser: 'stair-max-riser',
  minTread: 'stair-min-tread'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function stairForm(values = STAIR_DEFAULTS, errors = {}, quick = null) {
  const ids = STAIR_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('totalRise', { label: 'Total rise', suffix: 'in', hint: 'From the finished floor at the bottom to the finished floor at the top. 9 ft = 108 in.' })}
  ${field('treadDepth', { label: 'Tread depth (run per step)', suffix: 'in', hint: 'Measured from the front of one tread to the front of the next, not including the nosing overhang.' })}
  ${field('treadThickness', { label: 'Tread thickness', suffix: 'in', optional: true, hint: 'Used to shorten the bottom of the stringer so the first step matches the rest.' })}
  ${field('risers', { label: 'Number of risers', inputmode: 'numeric', optional: true, hint: 'Leave blank for the fewest risers that stay within the limit below.' })}
  <h3 class="form-group-title">Your local code limits</h3>
  ${field('maxRiser', { label: 'Maximum riser height', suffix: 'in', hint: 'Prefilled with the 2021 International Residential Code value. Your city or state may differ.' })}
  ${field('minTread', { label: 'Minimum tread depth', suffix: 'in' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

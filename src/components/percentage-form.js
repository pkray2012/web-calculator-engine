/**
 * Percentage Calculator form: percent of a number, what percent one number
 * is of another, percent change, and percent off. Only the inputs for the
 * selected mode are shown (CSS :has, no script needed). Rendered at build
 * time and reused by the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { PERCENT_DEFAULTS } from '../adapters/percentage.js';

export const PERCENT_FIELD_IDS = Object.freeze({
  mode: 'pct-mode',
  ofPercent: 'pct-of-percent',
  ofValue: 'pct-of-value',
  isPart: 'pct-is-part',
  isWhole: 'pct-is-whole',
  changeFrom: 'pct-change-from',
  changeTo: 'pct-change-to',
  offPrice: 'pct-off-price',
  offPercent: 'pct-off-percent',
  offExtra: 'pct-off-extra'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function percentForm(values = PERCENT_DEFAULTS, errors = {}, quick = null) {
  const ids = PERCENT_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--pct" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${radioField({
    id: ids.mode, name: 'mode', legend: 'What do you want to work out?', value: values.mode,
    options: [
      { value: 'of', label: 'What is X% of Y?', id: 'pct-mode-of' },
      { value: 'is', label: 'X is what percent of Y?', id: 'pct-mode-is' },
      { value: 'change', label: 'Percent increase or decrease', id: 'pct-mode-change' },
      { value: 'off', label: 'Percent off a price', id: 'pct-mode-off' }
    ]
  })}
  <div class="mode-of">
    ${field('ofPercent', { label: 'Percent', suffix: '%' })}
    ${field('ofValue', { label: 'Number', hint: 'The number to take the percentage of.' })}
  </div>
  <div class="mode-is">
    ${field('isPart', { label: 'Part', hint: 'The smaller amount, for example a score or a share.' })}
    ${field('isWhole', { label: 'Whole', hint: 'The total it is part of.' })}
  </div>
  <div class="mode-change">
    ${field('changeFrom', { label: 'Starting value' })}
    ${field('changeTo', { label: 'New value' })}
  </div>
  <div class="mode-off">
    ${field('offPrice', { label: 'Original price', prefix: '$' })}
    ${field('offPercent', { label: 'Discount', suffix: '% off' })}
    ${field('offExtra', { label: 'Extra discount', suffix: '% off', optional: true, hint: 'A second discount applied after the first, such as a coupon.' })}
  </div>
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

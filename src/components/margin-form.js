/**
 * Profit Margin Calculator form: margin and markup from a cost and a price,
 * or a price from a target margin or markup. Only the inputs for the selected
 * mode are shown (CSS :has, no script needed). Rendered at build time and
 * reused by the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { MARGIN_DEFAULTS } from '../adapters/margin.js';

export const MARGIN_FIELD_IDS = Object.freeze({
  mode: 'margin-mode',
  cost: 'margin-cost',
  price: 'margin-price',
  marginPercent: 'margin-target',
  markupPercent: 'margin-markup',
  fixedCosts: 'margin-fixed'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function marginForm(values = MARGIN_DEFAULTS, errors = {}, quick = null) {
  const ids = MARGIN_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--margin" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${radioField({
    id: ids.mode, name: 'mode', legend: 'What do you know?', value: values.mode,
    options: [
      { value: 'cp', label: 'Cost and selling price', id: 'margin-mode-cp' },
      { value: 'margin', label: 'Cost and the margin I want', id: 'margin-mode-margin' },
      { value: 'markup', label: 'Cost and my markup', id: 'margin-mode-markup' }
    ]
  })}
  ${field('cost', { label: 'Cost', prefix: '$', hint: 'What one unit costs you to buy or make.' })}
  <div class="mode-cp">
    ${field('price', { label: 'Selling price', prefix: '$' })}
  </div>
  <div class="mode-margin">
    ${field('marginPercent', { label: 'Target margin', suffix: '%', hint: 'Profit as a share of the selling price.' })}
  </div>
  <div class="mode-markup">
    ${field('markupPercent', { label: 'Markup', suffix: '%', hint: 'Profit as a share of the cost.' })}
  </div>
  ${field('fixedCosts', { label: 'Fixed costs', prefix: '$', optional: true, hint: 'Rent, salaries and other costs that do not change with sales, to see how many units break even.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

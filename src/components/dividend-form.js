/**
 * Dividend Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, radioField, checkboxField } from './fields.js';
import { DIVIDEND_DEFAULTS } from '../adapters/dividend.js';
import { FREQUENCIES } from '../calculators/dividend.js';

export const DIVIDEND_FIELD_IDS = Object.freeze({
  initialInvestment: 'div-initial',
  monthlyContribution: 'div-monthly',
  dividendYield: 'div-yield',
  dividendGrowth: 'div-growth',
  priceGrowth: 'div-price-growth',
  years: 'div-years',
  frequency: 'div-frequency',
  reinvest: 'div-reinvest',
  taxRate: 'div-tax',
  targetIncome: 'div-target'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function dividendForm(values = DIVIDEND_DEFAULTS, errors = {}, quick = null) {
  const ids = DIVIDEND_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your investment</h3>
  ${field('initialInvestment', { label: 'Starting investment', prefix: '$', optional: true })}
  ${field('monthlyContribution', { label: 'Monthly contribution', prefix: '$', optional: true })}
  ${field('years', { label: 'Years', suffix: 'years', inputmode: 'numeric' })}
  <h3 class="form-group-title">The dividend</h3>
  ${field('dividendYield', { label: 'Dividend yield', suffix: '%', hint: 'Annual dividends per share ÷ share price.' })}
  ${radioField({
    id: ids.frequency, name: 'frequency', legend: 'Paid', value: values.frequency,
    options: Object.entries(FREQUENCIES).map(([value, label]) => ({ value, label, id: `div-frequency-${value}` }))
  })}
  ${checkboxField({ id: ids.reinvest, name: 'reinvest', label: 'Reinvest dividends (DRIP)', checked: values.reinvest === 'on' })}
  <h3 class="form-group-title">Assumptions (optional)</h3>
  ${field('dividendGrowth', { label: 'Dividend growth', suffix: '% a year', optional: true, hint: 'How much the dividend per share rises each year. Dividends can also be cut.' })}
  ${field('priceGrowth', { label: 'Share price growth', suffix: '% a year', optional: true })}
  ${field('taxRate', { label: 'Tax rate on dividends', suffix: '%', optional: true, hint: 'Leave at 0 for a tax-advantaged account such as an IRA or 401(k).' })}
  ${field('targetIncome', { label: 'Target annual dividend income', prefix: '$', optional: true, hint: 'Shows how much you would need invested today at this yield.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

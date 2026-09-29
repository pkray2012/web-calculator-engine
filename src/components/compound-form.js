/**
 * Compound Interest Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { COMPOUND_DEFAULTS } from '../adapters/compound-interest.js';

export const COMPOUND_FIELD_IDS = Object.freeze({
  initialDeposit: 'ci-initial',
  monthlyContribution: 'ci-monthly',
  ratePercent: 'ci-rate',
  compounding: 'ci-compounding',
  years: 'ci-years',
  contributionTiming: 'ci-timing',
  inflationPercent: 'ci-inflation'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function compoundForm(values = COMPOUND_DEFAULTS, errors = {}, quick = null) {
  const ids = COMPOUND_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your money</h3>
  ${field('initialDeposit', { label: 'Initial deposit', prefix: '$', optional: true })}
  ${field('monthlyContribution', { label: 'Monthly contribution', prefix: '$', optional: true })}
  ${radioField({
    id: ids.contributionTiming, name: 'contributionTiming', legend: 'Contributions are added', value: values.contributionTiming,
    options: [
      { value: 'end', label: 'At the end of each month', id: 'ci-timing-end' },
      { value: 'start', label: 'At the start of each month', id: 'ci-timing-start' }
    ]
  })}
  <h3 class="form-group-title">Growth</h3>
  ${field('ratePercent', { label: 'Annual interest rate', suffix: '%', hint: 'The stated rate before compounding. For an account APY, choose "Annually": it gives the same result.' })}
  ${radioField({
    id: ids.compounding, name: 'compounding', legend: 'Compounding', value: values.compounding,
    options: [
      { value: 'daily', label: 'Daily', id: 'ci-comp-daily' },
      { value: 'monthly', label: 'Monthly', id: 'ci-comp-monthly' },
      { value: 'quarterly', label: 'Quarterly', id: 'ci-comp-quarterly' },
      { value: 'annually', label: 'Annually', id: 'ci-comp-annually' },
      { value: 'continuously', label: 'Continuously', id: 'ci-comp-continuously' }
    ]
  })}
  ${field('years', { label: 'Years', inputmode: 'numeric' })}
  ${field('inflationPercent', { label: 'Inflation rate', suffix: '%', optional: true, hint: 'Shows the result in today’s dollars.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

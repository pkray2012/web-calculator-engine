/**
 * 401(k) Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { RETIREMENT_401K_DEFAULTS } from '../adapters/retirement-401k.js';

export const RETIREMENT_401K_FIELD_IDS = Object.freeze({
  currentAge: 'rk-age',
  retirementAge: 'rk-retire-age',
  salary: 'rk-salary',
  contributionPercent: 'rk-contribution',
  currentBalance: 'rk-balance',
  annualReturn: 'rk-return',
  salaryGrowth: 'rk-salary-growth',
  match1Rate: 'rk-match1-rate',
  match1UpTo: 'rk-match1-upto',
  match2Rate: 'rk-match2-rate',
  match2UpTo: 'rk-match2-upto',
  inflation: 'rk-inflation'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function retirement401kForm(values = RETIREMENT_401K_DEFAULTS, errors = {}, quick = null) {
  const ids = RETIREMENT_401K_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">You and your pay</h3>
  ${field('currentAge', { label: 'Current age', suffix: 'years', inputmode: 'numeric' })}
  ${field('retirementAge', { label: 'Retirement age', suffix: 'years', inputmode: 'numeric' })}
  ${field('salary', { label: 'Annual salary', prefix: '$', hint: 'Pay before taxes and deductions.' })}
  ${field('contributionPercent', { label: 'Your contribution (% of pay)', suffix: '%', hint: 'Pre-tax and Roth deferrals together. Capped at the IRS limit for your age.' })}
  ${field('currentBalance', { label: 'Current 401(k) balance', prefix: '$', optional: true })}
  <h3 class="form-group-title">Employer match</h3>
  <p class="note">For example, “100% of the first 3% and 50% of the next 2%”. Enter 0 for no match.</p>
  ${field('match1Rate', { label: 'Employer matches (% of your contribution)', suffix: '%', optional: true })}
  ${field('match1UpTo', { label: 'Up to (% of your pay)', suffix: '%', optional: true })}
  ${field('match2Rate', { label: 'Then matches (% of your contribution)', suffix: '%', optional: true })}
  ${field('match2UpTo', { label: 'On the next (% of your pay)', suffix: '%', optional: true })}
  <h3 class="form-group-title">Assumptions (optional)</h3>
  ${field('annualReturn', { label: 'Annual return', suffix: '%', optional: true, hint: 'Per year, after fund fees. Returns vary from year to year and can be negative.' })}
  ${field('salaryGrowth', { label: 'Salary increase (per year)', suffix: '%', optional: true })}
  ${field('inflation', { label: 'Inflation (per year)', suffix: '%', optional: true, hint: 'Used only to show the balance in today’s dollars.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

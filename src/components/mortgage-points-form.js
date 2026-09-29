/**
 * Mortgage Points Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { POINTS_DEFAULTS } from '../adapters/mortgage-points.js';

export const POINTS_FIELD_IDS = Object.freeze({
  loanAmount: 'points-loan-amount',
  termYears: 'points-term',
  baseRate: 'base-rate',
  points: 'points-count',
  pointsRate: 'points-rate',
  stayYears: 'points-stay-years'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function mortgagePointsForm(values = POINTS_DEFAULTS, errors = {}, quick = null) {
  const ids = POINTS_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">The loan</h3>
  ${numberField({ id: ids.loanAmount, name: 'loanAmount', label: 'Loan amount', prefix: '$', value: values.loanAmount, error: errors.loanAmount })}
  ${numberField({ id: ids.termYears, name: 'termYears', label: 'Loan term', suffix: 'years', value: values.termYears, error: errors.termYears })}
  <h3 class="form-group-title">The two quotes</h3>
  ${numberField({ id: ids.baseRate, name: 'baseRate', label: 'Rate without points', suffix: '%', value: values.baseRate, hint: 'The interest rate (not the APR) quoted with no discount points.', error: errors.baseRate })}
  ${numberField({ id: ids.points, name: 'points', label: 'Discount points', suffix: 'points', value: values.points, hint: 'One point costs 1% of the loan amount. Fractions like 0.5 are fine.', error: errors.points })}
  ${numberField({ id: ids.pointsRate, name: 'pointsRate', label: 'Rate with points', suffix: '%', value: values.pointsRate, hint: 'The rate your lender quotes for those points.', error: errors.pointsRate })}
  ${numberField({ id: ids.stayYears, name: 'stayYears', label: 'How long you expect to keep the loan', suffix: 'years', value: values.stayYears, optional: true, hint: 'Until you sell, refinance or pay it off.', error: errors.stayYears })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

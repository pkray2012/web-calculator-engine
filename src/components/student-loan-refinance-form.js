/**
 * Student Loan Refinance Calculator form. Rendered at build time and reused by
 * the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, amountWithUnitField, radioField } from './fields.js';
import { SLR_DEFAULTS } from '../adapters/student-loan-refinance.js';

export const SLR_FIELD_IDS = Object.freeze({
  loanType: 'slr-loan-type',
  balance: 'slr-balance',
  currentRate: 'slr-current-rate',
  currentTermValue: 'slr-current-term',
  newRate: 'slr-new-rate',
  newTermValue: 'slr-new-term',
  fees: 'slr-fees'
});

const TERM_UNITS = [{ value: 'years', label: 'years' }, { value: 'months', label: 'months' }];

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function studentLoanRefinanceForm(values = SLR_DEFAULTS, errors = {}, quick = null) {
  const ids = SLR_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your student loans now</h3>
  ${radioField({
    id: ids.loanType, name: 'loanType', legend: 'What kind of loans are you refinancing?', value: values.loanType,
    options: [
      { value: 'federal', label: 'Federal student loans', id: 'slr-type-federal' },
      { value: 'private', label: 'Private student loans', id: 'slr-type-private' }
    ]
  })}
  ${numberField({ id: ids.balance, name: 'balance', label: 'Loan balance', prefix: '$', value: values.balance, hint: 'Total you would refinance. For several loans, add the balances.', error: errors.balance })}
  ${numberField({ id: ids.currentRate, name: 'currentRate', label: 'Current interest rate', suffix: '%', value: values.currentRate, hint: 'For several loans, use the weighted average rate.', error: errors.currentRate })}
  ${amountWithUnitField({ id: ids.currentTermValue, name: 'currentTermValue', unitName: 'currentTermUnit', legend: 'Time left on your loans', value: values.currentTermValue, unit: values.currentTermUnit, units: TERM_UNITS, error: errors.currentTermValue })}
  <h3 class="form-group-title">The refinance offer</h3>
  ${numberField({ id: ids.newRate, name: 'newRate', label: 'New interest rate', suffix: '%', value: values.newRate, hint: 'The fixed rate on your offer.', error: errors.newRate })}
  ${amountWithUnitField({ id: ids.newTermValue, name: 'newTermValue', unitName: 'newTermUnit', legend: 'New loan term', value: values.newTermValue, unit: values.newTermUnit, units: TERM_UNITS, error: errors.newTermValue })}
  ${numberField({ id: ids.fees, name: 'fees', label: 'Fees', prefix: '$', value: values.fees, optional: true, hint: 'Any origination or other fee on the offer.', error: errors.fees })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

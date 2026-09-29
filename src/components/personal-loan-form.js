/**
 * Personal Loan Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, monthField, amountWithUnitField } from './fields.js';
import { PERSONAL_DEFAULTS } from '../adapters/personal-loan.js';

export const PERSONAL_FIELD_IDS = Object.freeze({
  loanAmount: 'loan-amount',
  originationFeeRate: 'origination-fee',
  annualRate: 'interest-rate',
  termValue: 'term',
  extraMonthly: 'extra-monthly',
  startMonth: 'start-month'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function personalLoanForm(values = PERSONAL_DEFAULTS, errors = {}, quick = null) {
  const ids = PERSONAL_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${numberField({ id: ids.loanAmount, name: 'loanAmount', label: 'Loan amount', prefix: '$', value: values.loanAmount, hint: 'The amount on the loan agreement, before any fee is withheld.', error: errors.loanAmount })}
  ${numberField({ id: ids.originationFeeRate, name: 'originationFeeRate', label: 'Origination fee', suffix: '%', value: values.originationFeeRate, optional: true, hint: 'Percent of the loan withheld at funding. Enter 0 if there is none.', error: errors.originationFeeRate })}
  ${numberField({ id: ids.annualRate, name: 'annualRate', label: 'Interest rate', suffix: '%', value: values.annualRate, hint: 'The loan’s annual interest rate (not the APR, if they differ).', error: errors.annualRate })}
  ${amountWithUnitField({
    id: ids.termValue, name: 'termValue', unitName: 'termUnit', legend: 'Loan term',
    value: values.termValue, unit: values.termUnit, error: errors.termValue,
    units: [{ value: 'years', label: 'years' }, { value: 'months', label: 'months' }]
  })}
  <div class="calc-form__advanced">
    ${numberField({ id: ids.extraMonthly, name: 'extraMonthly', label: 'Extra monthly payment', prefix: '$', value: values.extraMonthly, optional: true, hint: 'Added to every payment and applied to principal.', error: errors.extraMonthly })}
    ${monthField({ id: ids.startMonth, name: 'startMonth', label: 'First payment month', value: values.startMonth, hint: 'Shows your payoff date.', error: errors.startMonth })}
  </div>
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

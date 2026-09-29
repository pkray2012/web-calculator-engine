/**
 * Loan Payment Calculator form. Rendered at build time and reused by the
 * browser controller for field ids, so markup and behavior stay in sync.
 */

import { html } from '../lib/html.js';
import { numberField, monthField, amountWithUnitField } from './fields.js';
import { LOAN_DEFAULTS } from '../adapters/loan-payment.js';

export const LOAN_FIELD_IDS = Object.freeze({
  principal: 'principal',
  annualRate: 'annual-rate',
  termValue: 'term',
  extraMonthly: 'extra-monthly',
  startMonth: 'start-month'
});

/** quick: optional pre-rendered loanQuickResult() markup. */
export function loanForm(values = LOAN_DEFAULTS, errors = {}, quick = null) {
  const ids = LOAN_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${numberField({ id: ids.principal, name: 'principal', label: 'Loan amount', prefix: '$', value: values.principal, error: errors.principal })}
  ${numberField({ id: ids.annualRate, name: 'annualRate', label: 'Interest rate (annual)', suffix: '%', value: values.annualRate, hint: 'The yearly rate on your loan, e.g. 7.25.', error: errors.annualRate })}
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

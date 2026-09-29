/**
 * Home Equity Loan Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, monthField, amountWithUnitField, checkboxField } from './fields.js';
import { HEL_DEFAULTS } from '../adapters/home-equity-loan.js';

export const HEL_FIELD_IDS = Object.freeze({
  homeValue: 'home-value',
  mortgageBalance: 'mortgage-balance',
  otherLiens: 'other-liens',
  loanAmount: 'hel-amount',
  closingCosts: 'hel-closing-costs',
  financeClosingCosts: 'hel-finance-costs',
  annualRate: 'hel-rate',
  termValue: 'hel-term',
  extraMonthly: 'hel-extra',
  startMonth: 'hel-start-month'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function homeEquityLoanForm(values = HEL_DEFAULTS, errors = {}, quick = null) {
  const ids = HEL_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your home</h3>
  ${numberField({ id: ids.homeValue, name: 'homeValue', label: 'Home value', prefix: '$', value: values.homeValue, hint: 'Your best estimate. The lender will use an appraisal or valuation.', error: errors.homeValue })}
  ${numberField({ id: ids.mortgageBalance, name: 'mortgageBalance', label: 'Mortgage balance', prefix: '$', value: values.mortgageBalance, hint: 'Enter 0 if the home is paid off.', error: errors.mortgageBalance })}
  ${numberField({ id: ids.otherLiens, name: 'otherLiens', label: 'Other home loans', prefix: '$', value: values.otherLiens, optional: true, hint: 'Balances on any other loan or line secured by the home.', error: errors.otherLiens })}
  <h3 class="form-group-title">The home equity loan</h3>
  ${numberField({ id: ids.loanAmount, name: 'loanAmount', label: 'Loan amount', prefix: '$', value: values.loanAmount, error: errors.loanAmount })}
  ${numberField({ id: ids.annualRate, name: 'annualRate', label: 'Interest rate', suffix: '%', value: values.annualRate, hint: 'The fixed rate on your quote (not the APR, if they differ).', error: errors.annualRate })}
  ${amountWithUnitField({
    id: ids.termValue, name: 'termValue', unitName: 'termUnit', legend: 'Loan term',
    value: values.termValue, unit: values.termUnit, error: errors.termValue,
    units: [{ value: 'years', label: 'years' }, { value: 'months', label: 'months' }]
  })}
  ${numberField({ id: ids.closingCosts, name: 'closingCosts', label: 'Closing costs', prefix: '$', value: values.closingCosts, optional: true, hint: 'Appraisal, origination and title fees from your Loan Estimate.', error: errors.closingCosts })}
  ${checkboxField({ id: ids.financeClosingCosts, name: 'financeClosingCosts', label: 'Add closing costs to the loan', checked: values.financeClosingCosts === 'on', hint: 'Unchecked: they come out of the money you receive.' })}
  <div class="calc-form__advanced">
    ${numberField({ id: ids.extraMonthly, name: 'extraMonthly', label: 'Extra monthly payment', prefix: '$', value: values.extraMonthly, optional: true, hint: 'Added to every payment and applied to principal.', error: errors.extraMonthly })}
    ${monthField({ id: ids.startMonth, name: 'startMonth', label: 'First payment month', value: values.startMonth, hint: 'Shows your payoff date.', error: errors.startMonth })}
  </div>
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

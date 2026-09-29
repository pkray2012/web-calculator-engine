/**
 * Mortgage Refinance Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, amountWithUnitField, checkboxField } from './fields.js';
import { REFI_DEFAULTS } from '../adapters/mortgage-refinance.js';

export const REFI_FIELD_IDS = Object.freeze({
  currentBalance: 'current-balance',
  currentRate: 'current-rate',
  currentTermValue: 'current-term',
  newRate: 'new-rate',
  newTermValue: 'new-term',
  closingCosts: 'closing-costs',
  financeClosingCosts: 'finance-closing-costs',
  stayYears: 'stay-years'
});

const TERM_UNITS = [{ value: 'years', label: 'years' }, { value: 'months', label: 'months' }];

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function refinanceForm(values = REFI_DEFAULTS, errors = {}, quick = null) {
  const ids = REFI_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your current mortgage</h3>
  ${numberField({ id: ids.currentBalance, name: 'currentBalance', label: 'Current loan balance', prefix: '$', value: values.currentBalance, hint: 'The principal you still owe, from your latest statement.', error: errors.currentBalance })}
  ${numberField({ id: ids.currentRate, name: 'currentRate', label: 'Current interest rate', suffix: '%', value: values.currentRate, error: errors.currentRate })}
  ${amountWithUnitField({ id: ids.currentTermValue, name: 'currentTermValue', unitName: 'currentTermUnit', legend: 'Time left on current loan', value: values.currentTermValue, unit: values.currentTermUnit, units: TERM_UNITS, error: errors.currentTermValue })}
  <h3 class="form-group-title">The new loan</h3>
  ${numberField({ id: ids.newRate, name: 'newRate', label: 'New interest rate', suffix: '%', value: values.newRate, hint: 'The rate on your refinance quote.', error: errors.newRate })}
  ${amountWithUnitField({ id: ids.newTermValue, name: 'newTermValue', unitName: 'newTermUnit', legend: 'New loan term', value: values.newTermValue, unit: values.newTermUnit, units: TERM_UNITS, error: errors.newTermValue })}
  ${numberField({ id: ids.closingCosts, name: 'closingCosts', label: 'Closing costs', prefix: '$', value: values.closingCosts, optional: true, hint: 'Total from your Loan Estimate.', error: errors.closingCosts })}
  ${checkboxField({ id: ids.financeClosingCosts, name: 'financeClosingCosts', label: 'Add closing costs to the new loan', checked: values.financeClosingCosts === 'on', hint: 'Leave unchecked if you pay them in cash at closing.' })}
  ${numberField({ id: ids.stayYears, name: 'stayYears', label: 'How long you expect to keep the loan', suffix: 'years', value: values.stayYears, optional: true, hint: 'Until you sell, refinance again or pay it off.', error: errors.stayYears })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

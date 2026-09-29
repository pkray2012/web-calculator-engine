/**
 * Auto Loan Refinance Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, amountWithUnitField, checkboxField } from './fields.js';
import { AUTO_REFI_DEFAULTS } from '../adapters/auto-loan-refinance.js';

export const AUTO_REFI_FIELD_IDS = Object.freeze({
  currentBalance: 'auto-payoff',
  currentRate: 'auto-current-rate',
  currentTermValue: 'auto-current-term',
  newRate: 'auto-new-rate',
  newTermValue: 'auto-new-term',
  fees: 'auto-refi-fees',
  prepaymentPenalty: 'auto-prepayment-penalty',
  financeCosts: 'auto-finance-costs',
  keepMonths: 'auto-keep-months'
});

const TERM_UNITS = [{ value: 'months', label: 'months' }, { value: 'years', label: 'years' }];

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function autoRefinanceForm(values = AUTO_REFI_DEFAULTS, errors = {}, quick = null) {
  const ids = AUTO_REFI_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your current car loan</h3>
  ${numberField({ id: ids.currentBalance, name: 'currentBalance', label: 'Payoff amount', prefix: '$', value: values.currentBalance, hint: 'Ask your lender for the payoff amount; it can differ from the statement balance.', error: errors.currentBalance })}
  ${numberField({ id: ids.currentRate, name: 'currentRate', label: 'Current interest rate', suffix: '%', value: values.currentRate, error: errors.currentRate })}
  ${amountWithUnitField({ id: ids.currentTermValue, name: 'currentTermValue', unitName: 'currentTermUnit', legend: 'Time left on current loan', value: values.currentTermValue, unit: values.currentTermUnit, units: TERM_UNITS, error: errors.currentTermValue })}
  ${numberField({ id: ids.prepaymentPenalty, name: 'prepaymentPenalty', label: 'Prepayment penalty', prefix: '$', value: values.prepaymentPenalty, optional: true, hint: 'Your contract says whether one applies. Most auto loans have none.', error: errors.prepaymentPenalty })}
  <h3 class="form-group-title">The refinance offer</h3>
  ${numberField({ id: ids.newRate, name: 'newRate', label: 'New interest rate', suffix: '%', value: values.newRate, error: errors.newRate })}
  ${amountWithUnitField({ id: ids.newTermValue, name: 'newTermValue', unitName: 'newTermUnit', legend: 'New loan term', value: values.newTermValue, unit: values.newTermUnit, units: TERM_UNITS, error: errors.newTermValue })}
  ${numberField({ id: ids.fees, name: 'fees', label: 'Refinance fees', prefix: '$', value: values.fees, optional: true, hint: 'Lender fees plus any state title or registration fees.', error: errors.fees })}
  ${checkboxField({ id: ids.financeCosts, name: 'financeCosts', label: 'Add fees and penalty to the new loan', checked: values.financeCosts === 'on', hint: 'Leave unchecked if you pay them in cash.' })}
  ${numberField({ id: ids.keepMonths, name: 'keepMonths', label: 'How long you expect to keep the car', suffix: 'months', value: values.keepMonths, optional: true, hint: 'Until you sell, trade in or pay it off.', error: errors.keepMonths })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

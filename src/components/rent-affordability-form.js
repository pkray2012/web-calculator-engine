/**
 * Rent Affordability Calculator form. Rendered at build time and reused by
 * the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { RENT_AFFORD_DEFAULTS } from '../adapters/rent-affordability.js';

export const RENT_AFFORD_FIELD_IDS = Object.freeze({
  annualGrossIncome: 'ra-income',
  monthlyUtilities: 'ra-utilities',
  monthlyTakeHome: 'ra-take-home',
  monthlyDebts: 'ra-debts',
  monthlyEssentials: 'ra-essentials',
  monthlySavings: 'ra-savings',
  rentConsidered: 'ra-rent',
  housingSharePercent: 'ra-share',
  incomeMultiple: 'ra-multiple'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function rentAffordabilityForm(values = RENT_AFFORD_DEFAULTS, errors = {}, quick = null) {
  const ids = RENT_AFFORD_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('annualGrossIncome', { label: 'Yearly income before taxes', prefix: '$', hint: 'Everyone on the lease, combined, if the landlord will count all incomes.' })}
  ${field('monthlyUtilities', { label: 'Utilities per month', prefix: '$', optional: true, hint: 'Electricity, gas, water and internet you would pay on top of rent.' })}
  <h3 class="form-group-title">Your budget (optional)</h3>
  ${field('monthlyTakeHome', { label: 'Monthly take-home pay', prefix: '$', optional: true, hint: 'After taxes and deductions. Leave blank to skip the budget view.' })}
  ${field('monthlyDebts', { label: 'Debt payments per month', prefix: '$', optional: true, hint: 'Car loan, student loans, credit card minimums.' })}
  ${field('monthlyEssentials', { label: 'Other essentials per month', prefix: '$', optional: true, hint: 'Food, transportation, insurance, child care, phone.' })}
  ${field('monthlySavings', { label: 'Savings per month', prefix: '$', optional: true })}
  <h3 class="form-group-title">Check a rent (optional)</h3>
  ${field('rentConsidered', { label: 'Rent you are considering', prefix: '$', optional: true })}
  <h3 class="form-group-title">Rules of thumb</h3>
  ${field('housingSharePercent', { label: 'Share of income for housing', suffix: '%', optional: true, hint: '30% is the cost-burden line HUD uses for rent plus utilities.' })}
  ${field('incomeMultiple', { label: 'Landlord income multiple', suffix: '× rent', optional: true, hint: 'Yearly income the landlord asks for as a multiple of monthly rent. Ask the landlord which multiple they use.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

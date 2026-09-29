/**
 * Auto Loan Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, monthField, checkboxField, radioField } from './fields.js';
import { AUTO_DEFAULTS } from '../adapters/auto-loan.js';

export const AUTO_FIELD_IDS = Object.freeze({
  mode: 'auto-mode',
  vehiclePrice: 'vehicle-price',
  monthlyBudget: 'monthly-budget',
  downPayment: 'down-payment',
  tradeInValue: 'trade-in-value',
  tradeInPayoff: 'trade-in-payoff',
  salesTaxRate: 'sales-tax-rate',
  taxAfterTradeIn: 'tax-after-trade-in',
  fees: 'fees',
  annualRate: 'apr',
  termMonths: 'term-months',
  extraMonthly: 'extra-monthly',
  startMonth: 'start-month'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function autoLoanForm(values = AUTO_DEFAULTS, errors = {}, quick = null) {
  const ids = AUTO_FIELD_IDS;
  return html`<form class="calc-form calc-form--auto" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${radioField({
    id: ids.mode, name: 'mode', legend: 'What do you know?', value: values.mode,
    options: [
      { value: 'price', label: 'The car price: find my payment', id: 'auto-mode-price' },
      { value: 'budget', label: 'My monthly budget: find the car price', id: 'auto-mode-budget' }
    ]
  })}
  <h3 class="form-group-title">Car and trade-in</h3>
  <div class="mode-price">
    ${numberField({ id: ids.vehiclePrice, name: 'vehiclePrice', label: 'Vehicle price', prefix: '$', value: values.vehiclePrice, hint: 'Negotiated price before tax and fees.', error: errors.vehiclePrice })}
  </div>
  <div class="mode-budget">
    ${numberField({ id: ids.monthlyBudget, name: 'monthlyBudget', label: 'Monthly payment budget', prefix: '$', value: values.monthlyBudget, hint: 'The loan payment you want, before insurance, fuel and upkeep.', error: errors.monthlyBudget })}
  </div>
  ${numberField({ id: ids.downPayment, name: 'downPayment', label: 'Down payment', prefix: '$', value: values.downPayment, optional: true, hint: 'Cash you pay up front.', error: errors.downPayment })}
  ${numberField({ id: ids.tradeInValue, name: 'tradeInValue', label: 'Trade-in value', prefix: '$', value: values.tradeInValue, optional: true, error: errors.tradeInValue })}
  ${numberField({ id: ids.tradeInPayoff, name: 'tradeInPayoff', label: 'Amount owed on trade-in', prefix: '$', value: values.tradeInPayoff, optional: true, hint: 'Your current loan payoff on the car you are trading in.', error: errors.tradeInPayoff })}
  <h3 class="form-group-title">Tax and fees</h3>
  ${numberField({ id: ids.salesTaxRate, name: 'salesTaxRate', label: 'Sales tax rate', suffix: '%', value: values.salesTaxRate, optional: true, hint: 'Your combined state and local rate for vehicle purchases.', error: errors.salesTaxRate })}
  ${checkboxField({ id: ids.taxAfterTradeIn, name: 'taxAfterTradeIn', label: 'Trade-in value reduces the taxable price', checked: values.taxAfterTradeIn === 'on', hint: 'Whether a trade-in lowers sales tax depends on your state. Leave unchecked to tax the full price.' })}
  ${numberField({ id: ids.fees, name: 'fees', label: 'Fees added to the loan', prefix: '$', value: values.fees, optional: true, hint: 'Title, registration and dealer documentation fees you are financing.', error: errors.fees })}
  <h3 class="form-group-title">Loan</h3>
  ${numberField({ id: ids.annualRate, name: 'annualRate', label: 'APR', suffix: '%', value: values.annualRate, hint: 'The annual rate on your offer, e.g. 6.9.', error: errors.annualRate })}
  ${numberField({ id: ids.termMonths, name: 'termMonths', label: 'Loan term', suffix: 'months', value: values.termMonths, inputmode: 'numeric', hint: 'Common terms are 36, 48, 60, 72 and 84 months.', error: errors.termMonths })}
  <div class="calc-form__advanced">
    ${numberField({ id: ids.extraMonthly, name: 'extraMonthly', label: 'Extra monthly payment', prefix: '$', value: values.extraMonthly, optional: true, hint: 'Added to every payment and applied to principal.', error: errors.extraMonthly })}
    ${monthField({ id: ids.startMonth, name: 'startMonth', label: 'First payment month', value: values.startMonth, hint: 'Shows your payoff date.', error: errors.startMonth })}
  </div>
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

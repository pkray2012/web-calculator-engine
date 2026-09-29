/**
 * Credit Card Payoff Calculator form. Only the inputs for the selected
 * planning mode are shown (CSS :has), so no page-specific script is needed.
 */

import { html } from '../lib/html.js';
import { numberField, monthField, radioField } from './fields.js';
import { CARD_DEFAULTS } from '../adapters/credit-card-payoff.js';

export const CARD_FIELD_IDS = Object.freeze({
  balance: 'card-balance',
  apr: 'card-apr',
  mode: 'plan-mode',
  monthlyPayment: 'monthly-payment',
  targetMonths: 'target-months',
  extraMonthly: 'extra-monthly',
  startMonth: 'start-month'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function creditCardForm(values = CARD_DEFAULTS, errors = {}, quick = null) {
  const ids = CARD_FIELD_IDS;
  return html`<form class="calc-form calc-form--card" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${numberField({ id: ids.balance, name: 'balance', label: 'Card balance', prefix: '$', value: values.balance, hint: 'The balance you want to pay off.', error: errors.balance })}
  ${numberField({ id: ids.apr, name: 'apr', label: 'APR', suffix: '%', value: values.apr, hint: 'The purchase APR on your statement.', error: errors.apr })}
  ${radioField({
    id: ids.mode, name: 'mode', legend: 'How do you want to plan?', value: values.mode,
    options: [
      { value: 'payment', label: 'I will pay a set amount each month', id: 'mode-payment' },
      { value: 'target', label: 'I want to be debt-free by a set time', id: 'mode-target' }
    ]
  })}
  <div class="mode-payment">
    ${numberField({ id: ids.monthlyPayment, name: 'monthlyPayment', label: 'Monthly payment', prefix: '$', value: values.monthlyPayment, hint: 'To see the minimum-payment trap, enter the minimum from your statement.', error: errors.monthlyPayment })}
    ${numberField({ id: ids.extraMonthly, name: 'extraMonthly', label: 'Extra monthly payment', prefix: '$', value: values.extraMonthly, optional: true, hint: 'Compare your plan with paying a little more.', error: errors.extraMonthly })}
  </div>
  <div class="mode-target">
    ${numberField({ id: ids.targetMonths, name: 'targetMonths', label: 'Months to pay off', suffix: 'months', value: values.targetMonths, inputmode: 'numeric', hint: 'For example 24 for two years.', error: errors.targetMonths })}
  </div>
  ${monthField({ id: ids.startMonth, name: 'startMonth', label: 'First payment month', value: values.startMonth, hint: 'Shows your debt-free date.', error: errors.startMonth })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

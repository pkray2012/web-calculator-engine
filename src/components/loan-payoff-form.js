/**
 * Loan Payoff Calculator form. Only the inputs for the selected mode are shown
 * (CSS :has), so no page-specific script is needed.
 */

import { html } from '../lib/html.js';
import { numberField, monthField, radioField } from './fields.js';
import { PAYOFF_DEFAULTS } from '../adapters/loan-payoff.js';

export const PAYOFF_FIELD_IDS = Object.freeze({
  balance: 'payoff-balance',
  annualRate: 'payoff-rate',
  payment: 'payoff-payment',
  mode: 'payoff-mode',
  extraMonthly: 'payoff-extra-monthly',
  targetYears: 'payoff-target-years',
  extraYearly: 'payoff-extra-yearly',
  lumpSum: 'payoff-lump-sum',
  lumpSumMonth: 'payoff-lump-month',
  startMonth: 'payoff-start-month'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function loanPayoffForm(values = PAYOFF_DEFAULTS, errors = {}, quick = null) {
  const ids = PAYOFF_FIELD_IDS;
  return html`<form class="calc-form calc-form--payoff" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your loan today</h3>
  ${numberField({ id: ids.balance, name: 'balance', label: 'Balance owed', prefix: '$', value: values.balance, hint: 'The principal balance on your latest statement.', error: errors.balance })}
  ${numberField({ id: ids.annualRate, name: 'annualRate', label: 'Interest rate', suffix: '%', value: values.annualRate, error: errors.annualRate })}
  ${numberField({ id: ids.payment, name: 'payment', label: 'Current monthly payment', prefix: '$', value: values.payment, hint: 'Principal and interest only; leave out escrow for taxes and insurance.', error: errors.payment })}
  <h3 class="form-group-title">Your payoff plan</h3>
  ${radioField({
    id: ids.mode, name: 'mode', legend: 'What do you want to know?', value: values.mode,
    options: [
      { value: 'extra', label: 'What paying extra saves', id: 'payoff-mode-extra' },
      { value: 'target', label: 'How much extra to be debt-free by a set time', id: 'payoff-mode-target' }
    ]
  })}
  <div class="mode-extra">
    ${numberField({ id: ids.extraMonthly, name: 'extraMonthly', label: 'Extra each month', prefix: '$', value: values.extraMonthly, optional: true, error: errors.extraMonthly })}
  </div>
  <div class="mode-target">
    ${numberField({ id: ids.targetYears, name: 'targetYears', label: 'Years to pay off', suffix: 'years', value: values.targetYears, hint: 'From your next payment. For example 7.5.', error: errors.targetYears })}
  </div>
  ${numberField({ id: ids.extraYearly, name: 'extraYearly', label: 'Extra once a year', prefix: '$', value: values.extraYearly, optional: true, hint: 'For example a tax refund or bonus, paid every 12th payment.', error: errors.extraYearly })}
  ${numberField({ id: ids.lumpSum, name: 'lumpSum', label: 'One-time extra payment', prefix: '$', value: values.lumpSum, optional: true, error: errors.lumpSum })}
  ${numberField({ id: ids.lumpSumMonth, name: 'lumpSumMonth', label: 'Paid with payment number', value: values.lumpSumMonth, optional: true, inputmode: 'numeric', hint: '1 is your next payment.', error: errors.lumpSumMonth })}
  ${monthField({ id: ids.startMonth, name: 'startMonth', label: 'Next payment month', value: values.startMonth, hint: 'Shows your payoff dates.', error: errors.startMonth })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

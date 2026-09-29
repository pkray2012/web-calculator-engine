/**
 * HELOC Payment Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, amountWithUnitField, radioField } from './fields.js';
import { HELOC_DEFAULTS } from '../adapters/heloc.js';

export const HELOC_FIELD_IDS = Object.freeze({
  balance: 'heloc-balance',
  rate: 'heloc-rate',
  drawValue: 'draw-period',
  repaymentValue: 'repayment-period',
  drawPayment: 'draw-payment'
});

const PERIOD_UNITS = [{ value: 'years', label: 'years' }, { value: 'months', label: 'months' }];

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function helocForm(values = HELOC_DEFAULTS, errors = {}, quick = null) {
  const ids = HELOC_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${numberField({ id: ids.balance, name: 'balance', label: 'Balance drawn', prefix: '$', value: values.balance, hint: 'The amount you owe on the line, or plan to draw.', error: errors.balance })}
  ${numberField({ id: ids.rate, name: 'rate', label: 'Interest rate', suffix: '%', value: values.rate, hint: 'Your current variable rate, or the rate you want to plan with.', error: errors.rate })}
  ${amountWithUnitField({ id: ids.drawValue, name: 'drawValue', unitName: 'drawUnit', legend: 'Draw period', value: values.drawValue, unit: values.drawUnit, units: PERIOD_UNITS, hint: 'Often 10 years. Check your HELOC agreement.', error: errors.drawValue })}
  ${amountWithUnitField({ id: ids.repaymentValue, name: 'repaymentValue', unitName: 'repaymentUnit', legend: 'Repayment period', value: values.repaymentValue, unit: values.repaymentUnit, units: PERIOD_UNITS, hint: 'Often 10 to 20 years after the draw period ends.', error: errors.repaymentValue })}
  ${radioField({
    id: ids.drawPayment,
    name: 'drawPayment',
    legend: 'Payments during the draw period',
    value: values.drawPayment,
    options: [
      { value: 'interestOnly', label: 'Interest only', id: 'draw-payment-io' },
      { value: 'principalAndInterest', label: 'Principal and interest', id: 'draw-payment-pi' }
    ]
  })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

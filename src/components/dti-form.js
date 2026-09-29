/**
 * Debt-to-Income Ratio Calculator form. Rendered at build time and reused by
 * the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { DTI_DEFAULTS } from '../adapters/debt-to-income.js';

export const DTI_FIELD_IDS = Object.freeze({
  incomeValue: 'dti-income',
  incomeUnit: 'dti-income-unit',
  housingPayment: 'dti-housing',
  autoPayment: 'dti-auto',
  studentPayment: 'dti-student',
  cardPayment: 'dti-card',
  personalPayment: 'dti-personal',
  supportPayment: 'dti-support',
  targetPercent: 'dti-target'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function dtiForm(values = DTI_DEFAULTS, errors = {}, quick = null) {
  const ids = DTI_FIELD_IDS;
  const money = (name, label, hint = null) => numberField({ id: ids[name], name, label, prefix: '$', value: values[name], optional: true, hint, error: errors[name] });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Income</h3>
  ${numberField({ id: ids.incomeValue, name: 'incomeValue', label: 'Gross income before taxes', prefix: '$', value: values.incomeValue, hint: 'Everyone who will be on the loan.', error: errors.incomeValue })}
  ${radioField({
    id: ids.incomeUnit, name: 'incomeUnit', legend: 'That income is', value: values.incomeUnit,
    options: [{ value: 'year', label: 'Per year', id: 'dti-income-year' }, { value: 'month', label: 'Per month', id: 'dti-income-month' }]
  })}
  <h3 class="form-group-title">Monthly debt payments</h3>
  ${money('housingPayment', 'Housing payment', 'Rent, or mortgage with taxes, insurance, PMI and HOA dues.')}
  ${money('autoPayment', 'Auto loans')}
  ${money('studentPayment', 'Student loans')}
  ${money('cardPayment', 'Credit card minimum payments', 'The minimum due, not the balance.')}
  ${money('personalPayment', 'Personal and other loans')}
  ${money('supportPayment', 'Child support or alimony')}
  <h3 class="form-group-title">Your target</h3>
  ${numberField({ id: ids.targetPercent, name: 'targetPercent', label: 'Target total ratio', suffix: '%', value: values.targetPercent, hint: '36% is a common guideline; lenders set their own limits.', error: errors.targetPercent })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

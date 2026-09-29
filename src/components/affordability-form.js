/**
 * Home Affordability Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { AFFORDABILITY_DEFAULTS } from '../adapters/mortgage-affordability.js';

export const AFFORDABILITY_FIELD_IDS = Object.freeze({
  annualIncome: 'afford-income',
  monthlyDebt: 'afford-debts',
  downPayment: 'afford-down',
  annualRate: 'afford-rate',
  termYears: 'afford-term',
  propertyTaxRate: 'afford-tax-rate',
  insuranceYearly: 'afford-insurance',
  hoaMonthly: 'afford-hoa',
  pmiRate: 'afford-pmi',
  frontEndRatio: 'afford-front',
  backEndRatio: 'afford-back'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function affordabilityForm(values = AFFORDABILITY_DEFAULTS, errors = {}, quick = null) {
  const ids = AFFORDABILITY_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Income, debts and savings</h3>
  ${numberField({ id: ids.annualIncome, name: 'annualIncome', label: 'Yearly income before taxes', prefix: '$', value: values.annualIncome, hint: 'Gross income for everyone on the loan.', error: errors.annualIncome })}
  ${numberField({ id: ids.monthlyDebt, name: 'monthlyDebt', label: 'Monthly debt payments', prefix: '$', value: values.monthlyDebt, optional: true, hint: 'Car, student and personal loans, card minimums, support. Not rent or utilities.', error: errors.monthlyDebt })}
  ${numberField({ id: ids.downPayment, name: 'downPayment', label: 'Down payment', prefix: '$', value: values.downPayment, optional: true, hint: 'Cash for the down payment, after setting aside closing costs.', error: errors.downPayment })}
  <h3 class="form-group-title">The loan</h3>
  ${numberField({ id: ids.annualRate, name: 'annualRate', label: 'Interest rate', suffix: '%', value: values.annualRate, hint: 'The rate on a quote (not the APR).', error: errors.annualRate })}
  ${numberField({ id: ids.termYears, name: 'termYears', label: 'Loan term in years', value: values.termYears, inputmode: 'numeric', error: errors.termYears })}
  <h3 class="form-group-title">Taxes, insurance and fees</h3>
  ${numberField({ id: ids.propertyTaxRate, name: 'propertyTaxRate', label: 'Property tax rate per year', suffix: '%', value: values.propertyTaxRate, optional: true, hint: 'A percent of the home price. Rates vary widely by place.', error: errors.propertyTaxRate })}
  ${numberField({ id: ids.insuranceYearly, name: 'insuranceYearly', label: 'Homeowners insurance per year', prefix: '$', value: values.insuranceYearly, optional: true, error: errors.insuranceYearly })}
  ${numberField({ id: ids.hoaMonthly, name: 'hoaMonthly', label: 'HOA dues per month', prefix: '$', value: values.hoaMonthly, optional: true, error: errors.hoaMonthly })}
  ${numberField({ id: ids.pmiRate, name: 'pmiRate', label: 'PMI rate per year', suffix: '%', value: values.pmiRate, optional: true, hint: 'Applied only with less than 20% down. A percent of the loan amount.', error: errors.pmiRate })}
  <h3 class="form-group-title">Your limits</h3>
  ${numberField({ id: ids.frontEndRatio, name: 'frontEndRatio', label: 'Housing limit, % of income', suffix: '%', value: values.frontEndRatio, hint: 'The full housing payment as a share of gross income. 28% is a common guideline.', error: errors.frontEndRatio })}
  ${numberField({ id: ids.backEndRatio, name: 'backEndRatio', label: 'Total debt limit, % of income', suffix: '%', value: values.backEndRatio, hint: 'Housing plus other debts. 36% is a common guideline; lenders may allow more.', error: errors.backEndRatio })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

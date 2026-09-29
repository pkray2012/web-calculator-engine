/**
 * Mortgage Payment Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, monthField, amountWithUnitField } from './fields.js';
import { MORTGAGE_DEFAULTS } from '../adapters/mortgage-payment.js';

export const MORTGAGE_FIELD_IDS = Object.freeze({
  homePrice: 'home-price',
  downPaymentValue: 'down-payment',
  annualRate: 'mortgage-rate',
  termValue: 'mortgage-term',
  propertyTaxYearly: 'property-tax',
  insuranceYearly: 'home-insurance',
  pmiRate: 'pmi-rate',
  hoaMonthly: 'hoa-dues',
  startMonth: 'mortgage-start-month'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function mortgagePaymentForm(values = MORTGAGE_DEFAULTS, errors = {}, quick = null) {
  const ids = MORTGAGE_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">The loan</h3>
  ${numberField({ id: ids.homePrice, name: 'homePrice', label: 'Home price', prefix: '$', value: values.homePrice, error: errors.homePrice })}
  ${amountWithUnitField({
    id: ids.downPaymentValue, name: 'downPaymentValue', unitName: 'downPaymentUnit', legend: 'Down payment',
    value: values.downPaymentValue, unit: values.downPaymentUnit, error: errors.downPaymentValue,
    units: [{ value: 'percent', label: '% of price' }, { value: 'dollars', label: 'dollars' }]
  })}
  ${numberField({ id: ids.annualRate, name: 'annualRate', label: 'Interest rate', suffix: '%', value: values.annualRate, hint: 'The rate on your quote (not the APR).', error: errors.annualRate })}
  ${amountWithUnitField({
    id: ids.termValue, name: 'termValue', unitName: 'termUnit', legend: 'Loan term',
    value: values.termValue, unit: values.termUnit, error: errors.termValue,
    units: [{ value: 'years', label: 'years' }, { value: 'months', label: 'months' }]
  })}
  <h3 class="form-group-title">Taxes, insurance and fees</h3>
  ${numberField({ id: ids.propertyTaxYearly, name: 'propertyTaxYearly', label: 'Property tax per year', prefix: '$', value: values.propertyTaxYearly, optional: true, hint: 'From the listing or your county. Rates vary widely by place.', error: errors.propertyTaxYearly })}
  ${numberField({ id: ids.insuranceYearly, name: 'insuranceYearly', label: 'Homeowners insurance per year', prefix: '$', value: values.insuranceYearly, optional: true, hint: 'From an insurance quote.', error: errors.insuranceYearly })}
  ${numberField({ id: ids.pmiRate, name: 'pmiRate', label: 'PMI rate per year', suffix: '%', value: values.pmiRate, optional: true, hint: 'Only with less than 20% down. A percent of the loan amount, from your lender.', error: errors.pmiRate })}
  ${numberField({ id: ids.hoaMonthly, name: 'hoaMonthly', label: 'HOA dues per month', prefix: '$', value: values.hoaMonthly, optional: true, error: errors.hoaMonthly })}
  ${monthField({ id: ids.startMonth, name: 'startMonth', label: 'First payment month', value: values.startMonth, hint: 'Shows your PMI and payoff dates.', error: errors.startMonth })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

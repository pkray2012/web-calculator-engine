/**
 * Rental Property Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { RENTAL_DEFAULTS } from '../adapters/rental-property.js';

export const RENTAL_FIELD_IDS = Object.freeze({
  purchasePrice: 'rp-price',
  downPaymentPercent: 'rp-down',
  closingCosts: 'rp-closing',
  repairCosts: 'rp-repairs',
  interestRate: 'rp-rate',
  termYears: 'rp-term',
  monthlyRent: 'rp-rent',
  otherMonthlyIncome: 'rp-other-income',
  vacancyPercent: 'rp-vacancy',
  propertyTaxYearly: 'rp-tax',
  insuranceYearly: 'rp-insurance',
  hoaMonthly: 'rp-hoa',
  utilitiesMonthly: 'rp-utilities',
  maintenancePercent: 'rp-maintenance',
  capexPercent: 'rp-capex',
  managementPercent: 'rp-management'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function rentalForm(values = RENTAL_DEFAULTS, errors = {}, quick = null) {
  const ids = RENTAL_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Purchase</h3>
  ${field('purchasePrice', { label: 'Purchase price', prefix: '$' })}
  ${field('downPaymentPercent', { label: 'Down payment', suffix: '% of price', hint: 'Enter 100 for an all-cash purchase.' })}
  ${field('closingCosts', { label: 'Closing costs', prefix: '$', optional: true })}
  ${field('repairCosts', { label: 'Upfront repairs', prefix: '$', optional: true, hint: 'Work needed before the first tenant moves in.' })}
  <h3 class="form-group-title">Loan</h3>
  ${field('interestRate', { label: 'Interest rate', suffix: '%', hint: 'Use the rate quoted for an investment-property loan, not a rate for a home you would live in.' })}
  ${field('termYears', { label: 'Loan term in years', inputmode: 'numeric' })}
  <h3 class="form-group-title">Income</h3>
  ${field('monthlyRent', { label: 'Monthly rent', prefix: '$' })}
  ${field('otherMonthlyIncome', { label: 'Other monthly income', prefix: '$', optional: true, hint: 'Parking, laundry, storage or pet fees.' })}
  ${field('vacancyPercent', { label: 'Vacancy', suffix: '% of the year', optional: true, hint: 'Share of income lost to empty months and unpaid rent.' })}
  <h3 class="form-group-title">Operating costs</h3>
  ${field('propertyTaxYearly', { label: 'Property tax per year', prefix: '$', optional: true })}
  ${field('insuranceYearly', { label: 'Landlord insurance per year', prefix: '$', optional: true })}
  ${field('hoaMonthly', { label: 'HOA dues per month', prefix: '$', optional: true })}
  ${field('utilitiesMonthly', { label: 'Utilities you pay per month', prefix: '$', optional: true })}
  ${field('maintenancePercent', { label: 'Maintenance', suffix: '% of collected rent', optional: true })}
  ${field('capexPercent', { label: 'Capital reserve', suffix: '% of collected rent', optional: true, hint: 'Saving for big replacements such as a roof, HVAC or appliances.' })}
  ${field('managementPercent', { label: 'Property management', suffix: '% of collected rent', optional: true, hint: 'Leave at 0 if you manage it yourself.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

/**
 * Rent vs. Buy Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { RVB_DEFAULTS } from '../adapters/rent-vs-buy.js';

export const RVB_FIELD_IDS = Object.freeze({
  homePrice: 'rvb-price',
  downPaymentPercent: 'rvb-down',
  annualRate: 'rvb-rate',
  termYears: 'rvb-term',
  monthlyRent: 'rvb-rent',
  years: 'rvb-years',
  appreciationPercent: 'rvb-appreciation',
  rentIncreasePercent: 'rvb-rent-increase',
  investmentReturnPercent: 'rvb-return',
  buyClosingCostPercent: 'rvb-closing',
  sellingCostPercent: 'rvb-selling',
  propertyTaxPercent: 'rvb-tax',
  insuranceYearly: 'rvb-insurance',
  maintenancePercent: 'rvb-maintenance',
  hoaMonthly: 'rvb-hoa',
  pmiRate: 'rvb-pmi',
  rentersInsuranceMonthly: 'rvb-renters-insurance'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function rentVsBuyForm(values = RVB_DEFAULTS, errors = {}, quick = null) {
  const ids = RVB_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Buying</h3>
  ${field('homePrice', { label: 'Home price', prefix: '$' })}
  ${field('downPaymentPercent', { label: 'Down payment', suffix: '% of price' })}
  ${field('annualRate', { label: 'Mortgage rate', suffix: '%', hint: 'The rate on a quote (not the APR).' })}
  ${field('termYears', { label: 'Loan term in years', inputmode: 'numeric' })}
  <h3 class="form-group-title">Renting</h3>
  ${field('monthlyRent', { label: 'Monthly rent for a similar home', prefix: '$' })}
  ${field('rentersInsuranceMonthly', { label: 'Renters insurance per month', prefix: '$', optional: true })}
  <h3 class="form-group-title">Your comparison</h3>
  ${field('years', { label: 'Years you expect to stay', inputmode: 'numeric', hint: 'The comparison assumes you sell at the end of this time.' })}
  ${field('appreciationPercent', { label: 'Home price growth per year', suffix: '%', optional: true, hint: 'An assumption, not a forecast. Prices can fall.' })}
  ${field('rentIncreasePercent', { label: 'Rent increase per year', suffix: '%', optional: true })}
  ${field('investmentReturnPercent', { label: 'Return on money not spent on housing', suffix: '%', optional: true, hint: 'What the down payment and any monthly savings would earn if invested instead. Not guaranteed.' })}
  <h3 class="form-group-title">Costs of owning</h3>
  ${field('buyClosingCostPercent', { label: 'Closing costs when buying', suffix: '% of price', optional: true })}
  ${field('sellingCostPercent', { label: 'Selling costs', suffix: '% of sale price', optional: true, hint: 'Agent commissions and other costs of selling.' })}
  ${field('propertyTaxPercent', { label: 'Property tax rate per year', suffix: '%', optional: true })}
  ${field('insuranceYearly', { label: 'Homeowners insurance per year', prefix: '$', optional: true })}
  ${field('maintenancePercent', { label: 'Maintenance per year', suffix: '% of value', optional: true })}
  ${field('hoaMonthly', { label: 'HOA dues per month', prefix: '$', optional: true })}
  ${field('pmiRate', { label: 'PMI rate per year', suffix: '%', optional: true, hint: 'Applied only with less than 20% down, until the balance reaches 78% of the price.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

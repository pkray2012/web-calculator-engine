/**
 * Car Lease Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { LEASE_DEFAULTS } from '../adapters/car-lease.js';

export const LEASE_FIELD_IDS = Object.freeze({
  msrp: 'lease-msrp',
  price: 'lease-price',
  residualPercent: 'lease-residual',
  leaseApr: 'lease-apr',
  leaseMonths: 'lease-months',
  downPayment: 'lease-down',
  tradeInValue: 'lease-trade-value',
  tradeInPayoff: 'lease-trade-payoff',
  capitalizedFees: 'lease-cap-fees',
  upfrontFees: 'lease-upfront-fees',
  paymentTaxPercent: 'lease-tax',
  loanApr: 'lease-loan-apr',
  loanMonths: 'lease-loan-months',
  purchaseTaxPercent: 'lease-purchase-tax'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function carLeaseForm(values = LEASE_DEFAULTS, errors = {}, quick = null) {
  const ids = LEASE_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">The car</h3>
  ${field('msrp', { label: 'MSRP (sticker price)', prefix: '$', hint: 'The residual is a percent of this.' })}
  ${field('price', { label: 'Negotiated price', prefix: '$', hint: 'The capitalized cost before fees and down payment.' })}
  <h3 class="form-group-title">The lease</h3>
  ${field('residualPercent', { label: 'Residual value', suffix: '% of MSRP', hint: 'Set by the leasing company; often about 50% to 60% for 36 months.' })}
  ${field('leaseApr', { label: 'Lease rate as an APR', suffix: '%', hint: 'Money factor × 2,400. A money factor of 0.0025 is 6%.' })}
  ${field('leaseMonths', { label: 'Lease term', suffix: 'months', inputmode: 'numeric' })}
  ${field('downPayment', { label: 'Down payment (cap cost reduction)', prefix: '$', optional: true })}
  ${field('tradeInValue', { label: 'Trade-in value', prefix: '$', optional: true })}
  ${field('tradeInPayoff', { label: 'Amount owed on trade-in', prefix: '$', optional: true })}
  ${field('capitalizedFees', { label: 'Fees added to the lease', prefix: '$', optional: true, hint: 'For example an acquisition fee rolled into the lease.' })}
  ${field('upfrontFees', { label: 'Fees paid at signing', prefix: '$', optional: true })}
  ${field('paymentTaxPercent', { label: 'Sales tax on lease payments', suffix: '%', optional: true, hint: 'Many states tax each payment; some tax differently.' })}
  <h3 class="form-group-title">Buying instead</h3>
  ${field('loanApr', { label: 'Loan APR', suffix: '%' })}
  ${field('loanMonths', { label: 'Loan term', suffix: 'months', inputmode: 'numeric' })}
  ${field('purchaseTaxPercent', { label: 'Sales tax on the price', suffix: '%', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

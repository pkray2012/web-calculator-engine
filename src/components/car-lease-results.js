/**
 * Results panel for the Car Lease Calculator. Pure function of the view model
 * from src/adapters/car-lease.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

function summary(view) {
  const { lease } = view;
  return statGrid([
    { label: 'Monthly lease payment', value: formatCurrency(lease.payment), primary: true, note: `For ${view.leaseMonths} months, tax included` },
    { label: 'Due at signing', value: formatCurrency(lease.dueAtSigning), note: 'Down payment, fees at signing and the first payment' },
    { label: 'Total cost of the lease', value: formatCurrency(lease.cashOut), note: 'Everything you pay; you return the car' },
    { label: 'Rent charge (finance cost)', value: formatCurrency(lease.totalRentCharge), note: `Money factor ${lease.moneyFactor.toFixed(5)}` }
  ]);
}

function paymentTable(view) {
  const { lease } = view;
  return dataTable({
    id: 'lease-payment',
    title: 'How the monthly payment is built',
    columns: [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows: [
      { item: 'Adjusted capitalized cost', amount: formatCurrency(lease.adjustedCapCost) },
      { item: 'Residual value', amount: formatCurrency(lease.residual) },
      { item: 'Depreciation per month', amount: formatCurrency(lease.depreciation) },
      { item: 'Rent charge per month', amount: formatCurrency(lease.rentCharge) },
      { item: 'Tax per month', amount: formatCurrency(lease.tax) },
      { item: 'Monthly payment', amount: formatCurrency(lease.payment), selected: true }
    ]
  });
}

function compareTable(view) {
  const { lease, buy } = view;
  return dataTable({
    id: 'lease-vs-buy',
    title: `Leasing vs. buying over ${view.leaseMonths} months`,
    columns: [{ key: 'item', label: 'Item' }, { key: 'lease', label: 'Lease', numeric: true }, { key: 'buy', label: 'Buy with a loan', numeric: true }],
    rows: [
      { item: 'Monthly payment', lease: formatCurrency(lease.payment), buy: formatCurrency(buy.payment) },
      { item: 'Cash paid over the term', lease: formatCurrencyWhole(lease.cashOut), buy: formatCurrencyWhole(buy.cashOut) },
      { item: 'Equity at the end (car value − loan balance)', lease: formatCurrencyWhole(0), buy: formatCurrencyWhole(buy.equityAtLeaseEnd) },
      { item: 'Net cost over the term', lease: formatCurrencyWhole(lease.cashOut), buy: formatCurrencyWhole(buy.netCost), selected: true }
    ]
  });
}

export function carLeaseResults(view) {
  const gap = formatCurrencyWhole(Math.abs(view.leaseMinusBuy));
  const verdict = view.leaseCheaper
    ? html`Over ${view.leaseMonths} months, leasing costs about <strong>${gap} less</strong> than buying, counting the buyer's equity in the car.`
    : html`Over ${view.leaseMonths} months, buying costs about <strong>${gap} less</strong> than leasing, counting the buyer's equity in the car.`;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your lease estimate</h2>
  ${summary(view)}
  ${paymentTable(view)}
</section>
<section class="result-block" aria-labelledby="compare-heading">
  <h2 id="compare-heading">Lease or buy?</h2>
  <p class="callout">${verdict}</p>
  ${compareTable(view)}
  <p class="note">Assumes the car is worth its residual value when the lease ends, and ignores mileage and wear charges, maintenance and insurance
  differences. The buyer still owes ${formatCurrencyWhole(view.buy.balanceAtLeaseEnd)} on the loan at that point.</p>
</section>`;
}

export function carLeaseQuickResult(view) {
  return html`<strong>${formatCurrency(view.lease.payment)}</strong>/month for ${view.leaseMonths} months · ${formatCurrency(view.lease.dueAtSigning)} due at signing.
  <a href="#summary-heading">See full results</a>`;
}

export function carLeaseAnnouncement(view) {
  const cheaper = view.leaseCheaper ? 'leasing' : 'buying';
  return `Lease payment ${formatCurrency(view.lease.payment)} a month. Over ${view.leaseMonths} months, ${cheaper} costs about ${formatCurrencyWhole(Math.abs(view.leaseMinusBuy))} less.`;
}

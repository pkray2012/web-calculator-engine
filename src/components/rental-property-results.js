/**
 * Results panel for the Rental Property Calculator. Pure function of the view
 * model from src/adapters/rental-property.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const pct = (ratio, digits = 2) => (ratio === null ? '—' : `${(ratio * 100).toFixed(digits)}%`);
const signed = (value) => (value < -0.005 ? `−${formatCurrency(-value)}` : formatCurrency(value));

export function rentalResults({ input, result: r }) {
  const stats = [
    { label: 'Cash flow per month', value: signed(r.monthlyCashFlow), primary: true, note: `${signed(r.annualCashFlow)} per year after the loan payment` },
    { label: 'Cash-on-cash return', value: pct(r.cashOnCash), note: `First-year cash flow ÷ ${formatCurrency(r.cashInvested)} invested` },
    { label: 'Cap rate', value: pct(r.capRate), note: `${formatCurrency(r.netOperatingIncome)} NOI ÷ ${formatCurrency(r.purchasePrice)} price` },
    { label: 'DSCR', value: r.dscr === null ? 'No loan' : r.dscr.toFixed(2), note: r.dscr === null ? 'All-cash purchase' : 'NOI ÷ yearly loan payments' }
  ];
  let note;
  if (r.breakEvenRent === null) note = 'Vacancy and percentage costs take all of the income, so no rent breaks even.';
  else if (r.annualCashFlow < 0) note = `The property loses money in the first year at this rent. It breaks even at about ${formatCurrency(r.breakEvenRent)} a month.`;
  else note = `Rent could fall to about ${formatCurrency(r.breakEvenRent)} a month before cash flow turns negative.`;
  const e = r.expenses;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">First-year returns</h2>
  ${statGrid(stats)}
  <p class="note">${note}</p>
</section>
<section class="result-block" aria-labelledby="noi-heading">
  <h2 id="noi-heading">Income, costs and cash flow per year</h2>
  ${dataTable({
    id: 'rp-noi',
    title: 'From rent to cash flow, first year',
    columns: [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Per year', numeric: true }],
    rows: [
      { item: 'Gross scheduled income', amount: formatCurrency(r.grossScheduledIncome) },
      { item: `Vacancy (${input.vacancyPercent}%)`, amount: signed(-r.vacancyLoss) },
      { item: 'Effective gross income', amount: formatCurrency(r.effectiveGrossIncome) },
      { item: 'Property tax', amount: signed(-e.propertyTax) },
      { item: 'Insurance', amount: signed(-e.insurance) },
      { item: 'HOA dues', amount: signed(-e.hoa) },
      { item: 'Utilities', amount: signed(-e.utilities) },
      { item: `Maintenance (${input.maintenancePercent}%)`, amount: signed(-e.maintenance) },
      { item: `Capital reserve (${input.capexPercent}%)`, amount: signed(-e.capitalReserve) },
      { item: `Management (${input.managementPercent}%)`, amount: signed(-e.management) },
      { item: 'Net operating income (NOI)', amount: signed(r.netOperatingIncome) },
      { item: 'Loan payments (principal and interest)', amount: signed(-r.annualDebtService) },
      { item: 'Cash flow', amount: signed(r.annualCashFlow) }
    ]
  })}
  <p class="note">Gross rent multiplier: ${r.grossRentMultiplier === null ? '—' : r.grossRentMultiplier.toFixed(2)}. Operating costs are
  ${pct(r.expenseRatio, 1)} of collected income. Cash invested: ${formatCurrency(r.downPayment)} down + ${formatCurrency(input.closingCosts)} closing +
  ${formatCurrency(input.repairCosts)} repairs.</p>
</section>`;
}

export function rentalQuickResult({ result: r }) {
  return html`<strong>${signed(r.monthlyCashFlow)}</strong> a month cash flow, ${pct(r.capRate)} cap rate. <a href="#summary-heading">See full results</a>`;
}

export function rentalAnnouncement({ result: r }) {
  return `Cash flow ${signed(r.monthlyCashFlow)} per month. Cash-on-cash return ${pct(r.cashOnCash)}. Cap rate ${pct(r.capRate)}.`;
}

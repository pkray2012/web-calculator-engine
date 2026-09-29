/**
 * Results panel for the Debt-to-Income Ratio Calculator. Pure function of the
 * view model from src/adapters/debt-to-income.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

function summary(view) {
  return statGrid([
    { label: 'Debt-to-income ratio', value: formatPercent(view.backEndPercent, 1), primary: true, note: `${formatCurrency(view.totalDebt)} of ${formatCurrency(view.grossMonthlyIncome)} gross monthly income` },
    { label: 'Housing ratio', value: formatPercent(view.frontEndPercent, 1), note: 'Housing payment only (front-end)' },
    view.overTarget
      ? { label: `To reach ${formatPercent(view.targetPercent, 1)}`, value: `${formatCurrency(view.reductionNeeded)}/month`, note: 'Less in monthly debt payments' }
      : { label: `Room under ${formatPercent(view.targetPercent, 1)}`, value: `${formatCurrency(view.roomForNewPayment)}/month`, note: 'For new debt payments' }
  ]);
}

function breakdown(view) {
  const rows = [
    ...(view.housingPayment > 0 ? [{ label: 'Housing payment', amount: view.housingPayment }] : []),
    ...view.shares
  ];
  return dataTable({
    id: 'dti-breakdown',
    title: 'Each payment as a share of gross monthly income',
    columns: [{ key: 'item', label: 'Payment' }, { key: 'amount', label: 'Per month', numeric: true }, { key: 'share', label: 'Of income', numeric: true }],
    rows: [
      ...rows.map((row) => ({ item: row.label, amount: formatCurrency(row.amount), share: formatPercent(row.amount / view.grossMonthlyIncome * 100, 1) })),
      { item: 'Total', amount: formatCurrency(view.totalDebt), share: formatPercent(view.backEndPercent, 1), selected: true }
    ]
  });
}

export function dtiResults(view) {
  const status = view.overTarget
    ? html`<p class="callout callout--warning">Your total ratio is above your ${formatPercent(view.targetPercent, 1)} target. Paying
    <strong>${formatCurrency(view.reductionNeeded)}</strong> less each month, for example by paying off a loan, would bring it to the target.</p>`
    : html`<p class="callout">Your total ratio is within your ${formatPercent(view.targetPercent, 1)} target, with
    <strong>${formatCurrency(view.roomForNewPayment)}</strong> a month of room before a new payment would take you over it.</p>`;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your debt-to-income ratio</h2>
  ${summary(view)}
  ${status}
  ${breakdown(view)}
  <p class="note">Lenders set their own limits and may count income and debts differently, for example including a new loan's payment.</p>
</section>`;
}

export function dtiQuickResult(view) {
  return html`Debt-to-income <strong>${formatPercent(view.backEndPercent, 1)}</strong> · housing ${formatPercent(view.frontEndPercent, 1)}.
  <a href="#summary-heading">See full results</a>`;
}

export function dtiAnnouncement(view) {
  const tail = view.overTarget
    ? `${formatCurrency(view.reductionNeeded)} a month over your ${formatPercent(view.targetPercent, 1)} target.`
    : `${formatCurrency(view.roomForNewPayment)} a month of room under your ${formatPercent(view.targetPercent, 1)} target.`;
  return `Debt-to-income ratio ${formatPercent(view.backEndPercent, 1)}, housing ratio ${formatPercent(view.frontEndPercent, 1)}. ${tail}`;
}

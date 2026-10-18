/**
 * Results panel for the Estimated Tax Calculator. Pure function of the view
 * model from src/adapters/estimated-tax.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency as formatRounded } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';
import { roundCents } from '../calculators/sales-tax.js';

const formatCurrency = (value) => formatRounded(roundCents(value));

/** "2026-04-15" → "April 15, 2026". */
export function formatDueDate(isoDate) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function estimatedTaxResults({ result: r }) {
  let note;
  if (r.noPriorYearTax) note = 'You had no tax last year, so for a full-year U.S. citizen or resident no underpayment penalty applies this year. Paying during the year still avoids a large bill at filing.';
  else if (r.underMinimum) note = `You expect to owe ${formatCurrency(r.balanceAfterWithholding)} after withholding, under $1,000, so estimated payments are not required.`;
  else if (r.safeHarborTotal === 0) note = 'Your withholding already covers the safe-harbor amount, so no estimated payments are needed to avoid the penalty.';
  else note = `Paying ${formatCurrency(r.safeHarborInstallment)} by each due date meets the ${r.safeHarborUsed === 'priorYear' ? `${Math.round(r.priorYearShare * 100)}% of last year’s tax` : '90% of this year’s tax'} safe harbor.`;
  const stats = [
    { label: 'Pay each quarter to avoid the penalty', value: formatCurrency(r.safeHarborInstallment), primary: true, note: `${formatCurrency(r.safeHarborTotal)} for the year` },
    { label: 'Still due when you file', value: formatCurrency(r.dueAtFilingWithSafeHarbor), note: 'If you pay only the safe-harbor amount' },
    { label: 'Pay each quarter to owe nothing at filing', value: formatCurrency(r.payInFullInstallment), note: `${formatCurrency(r.payInFullTotal)} of tax not covered by withholding` }
  ];
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your ${r.taxYear} estimated tax payments</h2>
  ${statGrid(stats)}
  <p class="note">${note}</p>
</section>
<section class="result-block" aria-labelledby="harbor-heading">
  <h2 id="harbor-heading">Safe-harbor test</h2>
  ${dataTable({
    id: 'est-harbor',
    title: 'Required annual payment',
    columns: [{ key: 'test', label: 'Test' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows: [
      { test: `90% of this year’s tax (${formatCurrency(r.currentYearTax)})`, amount: formatCurrency(r.currentYearTest) },
      { test: r.priorYearTest === null ? 'Last year’s tax: not entered' : `${Math.round(r.priorYearShare * 100)}% of last year’s tax (${formatCurrency(r.priorYearTax)})${r.highIncome ? ', because last year’s AGI was over the limit' : ''}`, amount: r.priorYearTest === null ? '—' : formatCurrency(r.priorYearTest) },
      { test: 'Required annual payment (the smaller)', amount: formatCurrency(r.requiredAnnualPayment) },
      { test: 'Minus withholding', amount: formatCurrency(r.withholding) },
      { test: 'Estimated payments to make', amount: formatCurrency(r.safeHarborTotal) }
    ]
  })}
</section>
<section class="result-block" aria-labelledby="dates-heading">
  <h2 id="dates-heading">Due dates</h2>
  ${dataTable({
    id: 'est-dates',
    title: `${r.taxYear} estimated tax due dates`,
    columns: [{ key: 'n', label: 'Payment' }, { key: 'date', label: 'Due' }, { key: 'harbor', label: 'Safe harbor', numeric: true }, { key: 'full', label: 'Owe nothing', numeric: true }],
    rows: r.dueDates.map((date, index) => ({
      n: String(index + 1),
      date: formatDueDate(date),
      harbor: formatCurrency(r.safeHarborInstallment),
      full: formatCurrency(r.payInFullInstallment)
    }))
  })}
</section>`;
}

export function estimatedTaxQuickResult({ result: r }) {
  return html`<strong>${formatCurrency(r.safeHarborInstallment)}</strong> per quarter to avoid the penalty. <a href="#summary-heading">See full results</a>`;
}

export function estimatedTaxAnnouncement({ result: r }) {
  return `Pay ${formatCurrency(r.safeHarborInstallment)} each quarter to avoid the penalty, or ${formatCurrency(r.payInFullInstallment)} each quarter to owe nothing at filing.`;
}

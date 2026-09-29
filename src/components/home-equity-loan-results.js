/**
 * Results panel for the Home Equity Loan Calculator: the borrowing limit at
 * common CLTV caps, plus the shared amortized-loan sections.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent } from '../lib/format.js';
import { dataTable } from './results.js';
import {
  summaryBlock, extraPaymentBlock, termComparisonBlock, scheduleBlock, quickResult, announcement
} from './amortized-results.js';

const pct = (value) => formatPercent(value, 1);

function limitNote(home) {
  const fitsAll = home.limits.every((row) => row.fits);
  const fitsNone = home.limits.every((row) => !row.fits);
  if (fitsAll) {
    return html`<p class="callout">This loan brings total debt on the home to <strong>${pct(home.newCltv)}</strong> of its value, within all three common limits.</p>`;
  }
  if (fitsNone) {
    return html`<p class="callout callout--warning"><strong>This loan would bring total debt on the home to ${pct(home.newCltv)} of its value</strong>,
    above all three common limits. Lenders using these caps would offer less, or nothing, against this home.</p>`;
  }
  const highest = home.limits.filter((row) => !row.fits).at(-1);
  return html`<p class="callout callout--warning"><strong>This loan brings total debt on the home to ${pct(home.newCltv)} of its value.</strong>
  A lender that caps at ${highest.cltvPercent}% would lend at most ${formatCurrency(highest.capacity)}.</p>`;
}

function borrowingBlock(view) {
  const { home } = view;
  return html`<section class="result-block" aria-labelledby="limit-heading">
  <h2 id="limit-heading">How much you might be able to borrow</h2>
  <p class="note">You have ${formatCurrency(home.equity)} of equity; ${pct(home.currentCltv)} of the home's value is already borrowed. Lenders usually cap
  total home debt at a percentage of its value (the CLTV limit); the cap, your income and your credit decide the actual amount.</p>
  ${dataTable({
    id: 'hel-limits',
    title: 'Largest new loan at common CLTV limits',
    columns: [
      { key: 'limit', label: 'CLTV limit' },
      { key: 'maxDebt', label: 'Total home debt allowed', numeric: true },
      { key: 'capacity', label: 'Largest new loan', numeric: true },
      { key: 'fits', label: 'Your loan fits?' }
    ],
    rows: home.limits.map((row) => ({
      limit: `${row.cltvPercent}%`,
      maxDebt: formatCurrency(row.maxTotalDebt),
      capacity: formatCurrency(row.capacity),
      fits: row.fits ? 'Yes' : 'No'
    }))
  })}
  ${limitNote(home)}
</section>`;
}

function moneyFlow(view) {
  const { home } = view;
  const costLine = home.financeClosingCosts
    ? { item: 'Closing costs, added to the loan', amount: `+ ${formatCurrency(home.closingCosts)}` }
    : { item: 'Closing costs, taken from the loan', amount: `− ${formatCurrency(home.closingCosts)}` };
  return dataTable({
    id: 'hel-flow',
    title: 'What you receive and what you repay',
    columns: [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows: [
      { item: 'Loan amount requested', amount: formatCurrency(home.loanAmount) },
      costLine,
      { item: 'Cash you receive', amount: formatCurrency(home.cashReceived), selected: true },
      { item: 'Balance you repay', amount: formatCurrency(view.input.principal) },
      { item: 'Total of payments', amount: formatCurrency(view.totalRepayment) },
      { item: 'Cost of borrowing (interest + closing costs)', amount: formatCurrency(home.costOfBorrowing), selected: true }
    ]
  });
}

export function homeEquityLoanResults(view) {
  const { home } = view;
  return html`${summaryBlock(view, {
    principalLabel: 'Loan balance',
    extraStats: [
      { label: 'Cash you receive', value: formatCurrency(home.cashReceived), note: home.closingCosts > 0 ? `${formatCurrency(home.closingCosts)} closing costs ${home.financeClosingCosts ? 'added to the loan' : 'deducted'}` : 'No closing costs entered' },
      { label: 'Combined loan-to-value', value: pct(home.newCltv), note: `Up from ${pct(home.currentCltv)}` }
    ],
    note: 'Principal and interest on a fixed-rate loan. Property taxes and insurance are not included.'
  })}
${borrowingBlock(view)}
<section class="result-block" aria-labelledby="flow-heading">
  <h2 id="flow-heading">Cash in hand vs. what you repay</h2>
  ${moneyFlow(view)}
</section>
${extraPaymentBlock(view)}
${termComparisonBlock(view, { title: 'Same loan and rate over common home equity terms' })}
${scheduleBlock(view)}`;
}

export function homeEquityQuickResult(view) {
  return html`${quickResult(view)} CLTV ${pct(view.home.newCltv)}.`;
}

export function homeEquityAnnouncement(view) {
  return `${announcement(view)} You receive ${formatCurrency(view.home.cashReceived)}; combined loan-to-value ${pct(view.home.newCltv)}.`;
}

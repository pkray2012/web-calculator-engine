/**
 * Results panel for the Personal Loan Calculator: the money-flow table and
 * fee-adjusted APR, plus the shared amortized-loan sections.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent } from '../lib/format.js';
import { dataTable } from './results.js';
import {
  summaryBlock, extraPaymentBlock, termComparisonBlock, scheduleBlock, quickResult, announcement
} from './amortized-results.js';

function moneyFlow(view) {
  const { fee } = view;
  return html`<section class="result-block" aria-labelledby="flow-heading">
  <h2 id="flow-heading">What you receive and what you repay</h2>
  ${dataTable({
    id: 'flow-table',
    title: 'Loan money flow',
    columns: [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows: [
      { item: 'Loan amount (what you repay principal on)', amount: formatCurrency(view.input.principal) },
      { item: `Origination fee (${formatPercent(fee.rate, 3)}), withheld`, amount: `− ${formatCurrency(fee.amount)}` },
      { item: 'Cash you receive', amount: formatCurrency(fee.amountReceived), selected: true },
      { item: 'Total you repay', amount: formatCurrency(fee.totalRepaid) },
      { item: 'Cost of borrowing (interest + fee)', amount: formatCurrency(fee.costOfBorrowing), selected: true }
    ]
  })}
  ${fee.amount > 0
    ? html`<p class="note">The interest rate is ${formatPercent(view.input.annualRate, 3)}, but because the fee is taken out of the money you receive,
    the loan costs the equivalent of <strong>${formatPercent(fee.effectiveAPR, 2)} a year</strong> on the cash you actually get.</p>`
    : html`<p class="note">With no origination fee, the fee-adjusted APR equals the interest rate.</p>`}
</section>`;
}

function extraEffectiveRate(view) {
  const { fee } = view;
  if (!fee.withExtra || fee.amount === 0) return '';
  return html`<p class="note">Paying extra cuts interest, but the ${formatCurrency(fee.amount)} fee is not refunded when you pay early,
  so it is spread over a shorter time: the effective rate with extra payments is <strong>${formatPercent(fee.withExtra.effectiveAPR, 2)}</strong>
  (versus ${formatPercent(fee.effectiveAPR, 2)} on schedule), and the total cost of borrowing falls to ${formatCurrency(fee.withExtra.costOfBorrowing)}.</p>`;
}

export function personalLoanResults(view) {
  const { fee } = view;
  return html`${summaryBlock(view, {
    principalLabel: 'Loan amount',
    extraStats: [
      { label: 'Cash you receive', value: formatCurrency(fee.amountReceived), note: fee.amount > 0 ? `After a ${formatCurrency(fee.amount)} fee` : 'No fee withheld' },
      { label: 'Fee-adjusted APR', value: formatPercent(fee.effectiveAPR, 2), note: `Interest rate ${formatPercent(view.input.annualRate, 3)}` },
      { label: 'Cost of borrowing', value: formatCurrency(fee.costOfBorrowing), note: 'Interest + fee' }
    ],
    note: 'Loan payments only. Late fees and optional insurance are not included.'
  })}
${moneyFlow(view)}
${extraPaymentBlock(view, { after: extraEffectiveRate(view) })}
${termComparisonBlock(view, {
    title: 'Same loan amount, fee and rate over common terms',
    note: 'A fixed fee costs more per year on a shorter loan, so the fee-adjusted APR rises as the term shortens even while total interest falls.'
  })}
${scheduleBlock(view)}`;
}

export function personalQuickResult(view) {
  return html`${quickResult(view)} Fee-adjusted APR ${formatPercent(view.fee.effectiveAPR, 2)}.`;
}

export function personalAnnouncement(view) {
  return `${announcement(view)} You receive ${formatCurrency(view.fee.amountReceived)}; fee-adjusted APR ${formatPercent(view.fee.effectiveAPR, 2)}.`;
}

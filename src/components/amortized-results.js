/**
 * Result sections shared by every amortizing-loan calculator.
 * Pure functions of the view model from src/adapters/amortized-view.js, used
 * both for pre-rendered examples and for live updates in the browser.
 */

import { html } from '../lib/html.js';
import {
  formatCurrency, formatCount, formatDuration, formatMonth, formatMonthShort, formatPercent, paymentMonth
} from '../lib/format.js';
import { statGrid, breakdownBar, dataTable } from './results.js';

function payoffText(payments, payoff) {
  return payoff
    ? `${formatMonth(payoff)} (${formatDuration(payments)})`
    : formatDuration(payments);
}

function summary(view, extraStats, rateLabel) {
  const { input } = view;
  return statGrid([
    {
      label: 'Monthly payment',
      value: formatCurrency(view.monthlyPayment),
      primary: true,
      note: `${formatCount(view.payments)} payments at ${formatPercent(input.annualRate, 3)} ${rateLabel}`
    },
    ...extraStats,
    { label: 'Total interest', value: formatCurrency(view.totalInterest) },
    { label: 'Total of payments', value: formatCurrency(view.totalRepayment) },
    { label: 'Paid off', value: payoffText(view.payments, view.payoff) }
  ]);
}

function extraComparison(view) {
  const { extra } = view;
  if (!extra) {
    return html`<p class="note">Add an extra monthly payment above to see how much interest and time it could save.</p>`;
  }
  const rows = [
    {
      plan: 'Required payment only',
      payment: formatCurrency(view.monthlyPayment),
      time: formatDuration(view.payments),
      interest: formatCurrency(view.totalInterest),
      total: formatCurrency(view.totalRepayment)
    },
    {
      plan: `With ${formatCurrency(extra.amount)} extra each month`,
      payment: formatCurrency(extra.monthlyPayment),
      time: formatDuration(extra.payments),
      interest: formatCurrency(extra.totalInterest),
      total: formatCurrency(extra.totalRepayment),
      selected: true
    }
  ];
  return html`<p class="callout">Paying <strong>${formatCurrency(extra.amount)}</strong> extra each month could save
  <strong>${formatCurrency(extra.interestSaved)}</strong> in interest and pay the loan off
  <strong>${formatDuration(extra.paymentsSaved)}</strong> sooner${extra.payoff ? html`, in <strong>${formatMonth(extra.payoff)}</strong>` : ''}.</p>
${dataTable({
    id: 'extra-table',
    title: 'Required payment compared with extra payments',
    columns: [
      { key: 'plan', label: 'Plan' },
      { key: 'payment', label: 'Monthly', numeric: true },
      { key: 'time', label: 'Time to pay off', numeric: true },
      { key: 'interest', label: 'Total interest', numeric: true },
      { key: 'total', label: 'Total paid', numeric: true }
    ],
    rows
  })}`;
}

/** Rows may carry effectiveAPR (fee-adjusted); the column appears only then. */
function termComparison(view, title = 'Same loan amount and rate over different terms') {
  const showApr = view.termComparison.every((row) => Number.isFinite(row.effectiveAPR));
  return dataTable({
    id: 'term-table',
    title,
    columns: [
      { key: 'term', label: 'Term' },
      { key: 'payment', label: 'Monthly payment', numeric: true },
      { key: 'interest', label: 'Total interest', numeric: true },
      ...(showApr ? [{ key: 'apr', label: 'Fee-adjusted APR', numeric: true }] : []),
      { key: 'difference', label: 'Interest vs. your term', numeric: true }
    ],
    rows: view.termComparison.map((row) => {
      const diff = row.totalInterest - view.totalInterest;
      return {
        term: `${formatDuration(row.termMonths)}${row.selected ? ' (yours)' : ''}`,
        payment: formatCurrency(row.monthlyPayment),
        interest: formatCurrency(row.totalInterest),
        apr: showApr ? formatPercent(row.effectiveAPR, 2) : '',
        difference: row.selected ? '—' : `${diff > 0 ? '+' : '−'}${formatCurrency(Math.abs(diff))}`,
        selected: row.selected
      };
    })
  });
}

function schedule(view) {
  const { startMonth } = view.input;
  const withExtra = view.schedule.basis === 'with-extra';
  const basis = withExtra ? 'including your extra payment' : 'with the required payment';
  const yearly = dataTable({
    id: 'schedule-yearly',
    title: `Amortization by year, ${basis}`,
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'payment', label: 'Paid', numeric: true },
      { key: 'principal', label: 'Principal', numeric: true },
      { key: 'interest', label: 'Interest', numeric: true },
      { key: 'balance', label: 'Ending balance', numeric: true }
    ],
    rows: view.schedule.yearly.map((row) => ({
      year: `Year ${row.year}`,
      payment: formatCurrency(row.payment),
      principal: formatCurrency(row.principal),
      interest: formatCurrency(row.interest),
      balance: formatCurrency(row.balance)
    }))
  });
  const monthly = dataTable({
    id: 'schedule-monthly',
    title: `Every monthly payment, ${basis}`,
    columns: [
      { key: 'month', label: startMonth ? 'Payment' : 'Payment #' },
      { key: 'payment', label: 'Payment', numeric: true },
      { key: 'principal', label: 'Principal', numeric: true },
      { key: 'interest', label: 'Interest', numeric: true },
      { key: 'balance', label: 'Balance', numeric: true }
    ],
    rows: view.schedule.monthly.map((row) => ({
      month: startMonth ? `${row.month}. ${formatMonthShort(paymentMonth(startMonth, row.month))}` : String(row.month),
      payment: formatCurrency(row.payment),
      principal: formatCurrency(row.principal),
      interest: formatCurrency(row.interest),
      balance: formatCurrency(row.balance)
    }))
  });
  return html`${yearly}
<details class="disclosure">
  <summary>Show all ${formatCount(view.schedule.monthly.length)} monthly payments</summary>
  ${monthly}
</details>`;
}

/**
 * Headline figures plus the principal/interest split.
 * options.extraStats: additional stat cards after the monthly payment.
 * options.principalLabel: what the borrowed amount is called (e.g. "Amount financed").
 * options.lead: optional markup placed before the stats (e.g. a warning).
 * options.note: what the figures include and exclude.
 * options.rateLabel: how the entered rate is described ("interest" or "APR").
 * @param {object} view
 * @param {{ extraStats?: object[], principalLabel?: string, lead?: unknown, note?: string, rateLabel?: string }} [options]
 */
export function summaryBlock(view, {
  extraStats = [], principalLabel = 'Principal', lead = '', rateLabel = 'interest',
  note = 'Principal and interest only, before any fees, taxes or insurance.'
} = {}) {
  const finalNote = Math.abs(view.finalPayment - view.monthlyPayment) >= 0.005
    ? html` The last payment is ${formatCurrency(view.finalPayment)} because of rounding to the remaining balance.`
    : '';
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your estimate</h2>
  ${lead}
  ${summary(view, extraStats, rateLabel)}
  ${breakdownBar({
    label: 'Where your payments go',
    parts: [
      { label: principalLabel, amount: view.input.principal, display: formatCurrency(view.input.principal) },
      { label: 'Interest', amount: view.totalInterest, display: formatCurrency(view.totalInterest) }
    ]
  })}
  <p class="note">${note}${finalNote}</p>
</section>`;
}

/** after: optional markup appended inside the section (e.g. a fee note). */
export function extraPaymentBlock(view, { after = null } = {}) {
  return html`<section class="result-block" aria-labelledby="extra-heading">
  <h2 id="extra-heading">Extra payments</h2>
  ${extraComparison(view)}
  ${after ?? ''}
</section>`;
}

export function termComparisonBlock(view, {
  note = 'A shorter term raises the monthly payment but cuts total interest.', title = undefined, heading = 'Compare loan terms'
} = {}) {
  return html`<section class="result-block" aria-labelledby="terms-heading">
  <h2 id="terms-heading">${heading}</h2>
  <p class="note">${note}</p>
  ${termComparison(view, title)}
</section>`;
}

export function scheduleBlock(view, { heading = 'Amortization schedule' } = {}) {
  return html`<section class="result-block" aria-labelledby="schedule-heading">
  <h2 id="schedule-heading">${heading}</h2>
  ${schedule(view)}
</section>`;
}

/** Compact figures shown under the Calculate button on small screens. */
export function quickResult(view) {
  return html`<strong>${formatCurrency(view.monthlyPayment)}</strong>/month ·
  ${formatCurrency(view.totalInterest)} total interest. <a href="#summary-heading">See full results</a>`;
}

/** One-sentence summary for the polite live region. */
export function announcement(view) {
  const extra = view.extra
    ? ` With the extra payment you could save ${formatCurrency(view.extra.interestSaved)} in interest.`
    : '';
  return `Monthly payment ${formatCurrency(view.monthlyPayment)}. Total interest ${formatCurrency(view.totalInterest)} over ${formatDuration(view.payments)}.${extra}`;
}

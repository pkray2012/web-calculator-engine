/**
 * Results panel for the Loan Payoff Calculator. Pure function of the view
 * model from src/adapters/loan-payoff.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration, formatMonth, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const when = (months, payoff) => (payoff ? `${formatMonth(payoff)} (${formatDuration(months)})` : formatDuration(months));

function summary(view) {
  const needed = view.target && !view.target.alreadyMet
    ? [{ label: 'Extra needed each month', value: formatCurrency(view.target.extraMonthly), note: `Monthly payment ${formatCurrency(view.input.payment + view.target.extraMonthly)}` }]
    : [];
  return statGrid([
    { label: 'Debt-free in', value: when(view.plan.months, view.plan.payoff), primary: true, note: view.hasExtras ? 'With your extra payments' : 'At your current payment' },
    ...needed,
    { label: 'Time saved', value: view.monthsSaved > 0 ? formatDuration(view.monthsSaved) : 'None', note: `vs. ${formatDuration(view.base.months)} at your current payment` },
    { label: 'Interest saved', value: formatCurrency(view.interestSaved), note: `${formatCurrency(view.plan.totalInterest)} interest left to pay` },
    { label: 'Total extra paid', value: formatCurrency(view.plan.totalExtra), note: 'Every extra goes to principal' }
  ]);
}

function verdictNote(view) {
  if (view.target?.alreadyMet) {
    return html`<p class="callout">Your plan already pays the loan off within ${formatDuration(view.target.months)}, in ${formatDuration(view.plan.months)}. No extra monthly payment is needed.</p>`;
  }
  if (!view.hasExtras) {
    return html`<p class="callout">At ${formatCurrency(view.input.payment)} a month the loan is paid off in ${formatDuration(view.base.months)}, with
    ${formatCurrency(view.base.totalInterest)} of interest still to pay. Add an extra payment to see what it saves.</p>`;
  }
  return html`<p class="callout">Your plan pays the loan off <strong>${formatDuration(view.monthsSaved)} sooner</strong> and saves
  <strong>${formatCurrency(view.interestSaved)}</strong> in interest: every $1 of extra payment saves about
  ${formatCurrency(view.interestSaved / view.plan.totalExtra)} of interest.</p>`;
}

function comparison(view) {
  return dataTable({
    id: 'payoff-compare',
    title: 'Current payment vs. your plan',
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'base', label: 'Current payment only', numeric: true },
      { key: 'plan', label: 'Your plan', numeric: true }
    ],
    rows: [
      { item: 'Paid off', base: when(view.base.months, view.base.payoff), plan: when(view.plan.months, view.plan.payoff) },
      { item: 'Number of payments', base: formatCount(view.base.months), plan: formatCount(view.plan.months) },
      { item: 'Interest still to pay', base: formatCurrency(view.base.totalInterest), plan: formatCurrency(view.plan.totalInterest) },
      { item: 'Total still to pay', base: formatCurrency(view.base.totalPaid), plan: formatCurrency(view.plan.totalPaid), selected: true }
    ]
  });
}

function schedule(view) {
  const table = dataTable({
    id: 'payoff-schedule',
    title: 'Your plan, year by year',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'paid', label: 'Paid', numeric: true },
      { key: 'principal', label: 'Principal', numeric: true },
      { key: 'interest', label: 'Interest', numeric: true },
      { key: 'balance', label: 'Balance at year end', numeric: true }
    ],
    rows: view.plan.yearly.map((row) => ({
      year: String(row.year),
      paid: formatCurrency(row.payment),
      principal: formatCurrency(row.principal),
      interest: formatCurrency(row.interest),
      balance: formatCurrency(row.balance)
    }))
  });
  return html`<details class="disclosure">
  <summary>Show all ${formatCount(view.plan.yearly.length)} years of your plan</summary>
  ${table}
</details>`;
}

export function loanPayoffResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your payoff estimate</h2>
  ${summary(view)}
  ${verdictNote(view)}
  <p class="note">Assumes a fixed rate, interest monthly at the annual rate ÷ 12, and extra payments applied to principal right after the regular payment.</p>
</section>
<section class="result-block" aria-labelledby="compare-heading">
  <h2 id="compare-heading">Current payment vs. your plan</h2>
  ${comparison(view)}
  ${schedule(view)}
</section>`;
}

export function loanPayoffQuickResult(view) {
  return html`Debt-free in <strong>${when(view.plan.months, view.plan.payoff)}</strong> · saves ${formatCurrency(view.interestSaved)}.
  <a href="#summary-heading">See full results</a>`;
}

export function loanPayoffAnnouncement(view) {
  const target = view.target && !view.target.alreadyMet ? ` Extra needed each month ${formatCurrency(view.target.extraMonthly)}.` : '';
  return `Debt-free in ${when(view.plan.months, view.plan.payoff)}. Interest saved ${formatCurrency(view.interestSaved)}.${target}`;
}

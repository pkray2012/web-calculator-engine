/**
 * Results panel for the Savings Goal Calculator. Pure function of the view
 * model from src/adapters/savings-goal.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration, formatPercent, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

function goalLabel(view) {
  const { input } = view;
  return input.goalType === 'emergency'
    ? `${formatCount(input.coverageMonths)} months × ${formatCurrency(input.monthlyExpenses)} of expenses`
    : 'Your savings goal';
}

function summary(view) {
  const primary = view.input.plan === 'date'
    ? { label: 'Save each month', value: formatCurrency(view.monthlyContribution), primary: true, note: `To reach the goal in ${formatDuration(view.months)}` }
    : { label: 'Time to reach your goal', value: formatDuration(view.months), primary: true, note: `Saving ${formatCurrency(view.monthlyContribution)} a month` };
  return statGrid([
    primary,
    { label: 'Goal', value: formatCurrency(view.target), note: goalLabel(view) },
    { label: 'Interest earned', value: formatCurrency(view.interest), note: `At ${formatPercent(view.input.apy, 2)} APY` },
    { label: 'Your deposits', value: formatCurrency(view.deposits), note: `Plus ${formatCurrency(view.input.currentSavings)} saved so far` }
  ]);
}

function comparison(view) {
  return dataTable({
    id: 'savings-comparison',
    title: 'Monthly amount to reach the goal by…',
    columns: [{ key: 'time', label: 'Time' }, { key: 'monthly', label: 'Save each month', numeric: true }],
    rows: view.comparison.map((row) => ({
      time: formatDuration(row.months),
      monthly: formatCurrency(row.monthlyContribution),
      selected: row.selected
    }))
  });
}

function schedule(view) {
  return dataTable({
    id: 'savings-schedule',
    title: 'Balance year by year',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'deposits', label: 'Deposits to date', numeric: true },
      { key: 'interest', label: 'Interest to date', numeric: true },
      { key: 'balance', label: 'Balance', numeric: true }
    ],
    rows: view.yearly.map((row) => ({
      year: row.month % 12 === 0 ? String(row.year) : `${row.year} (${row.month % 12} months)`,
      deposits: formatCurrency(row.deposits),
      interest: formatCurrency(row.interest),
      balance: formatCurrency(row.balance)
    }))
  });
}

export function savingsGoalResults(view) {
  if (view.alreadyFunded) {
    return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your savings plan</h2>
  <p class="callout"><strong>You have already reached this goal.</strong> ${formatCurrency(view.input.currentSavings)} saved covers the
  ${formatCurrency(view.target)} goal${view.input.goalType === 'emergency' ? ` (${goalLabel(view)})` : ''}.</p>
</section>`;
  }
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your savings plan</h2>
  ${summary(view)}
  <p class="note">Deposits are made at the end of each month and interest is credited monthly at the rate that compounds to your APY over a year.
  Rates on savings accounts can change.</p>
</section>
<section class="result-block" aria-labelledby="compare-heading">
  <h2 id="compare-heading">Faster or slower</h2>
  ${comparison(view)}
</section>
<section class="result-block" aria-labelledby="growth-heading">
  <h2 id="growth-heading">How the balance grows</h2>
  ${schedule(view)}
</section>`;
}

export function savingsQuickResult(view) {
  if (view.alreadyFunded) return html`<strong>Goal already reached.</strong> <a href="#summary-heading">See details</a>`;
  return view.input.plan === 'date'
    ? html`Save <strong>${formatCurrency(view.monthlyContribution)}</strong>/month for ${formatDuration(view.months)}. <a href="#summary-heading">See full results</a>`
    : html`Goal reached in <strong>${formatDuration(view.months)}</strong>. <a href="#summary-heading">See full results</a>`;
}

export function savingsAnnouncement(view) {
  if (view.alreadyFunded) return 'You have already reached this goal.';
  return view.input.plan === 'date'
    ? `Save ${formatCurrency(view.monthlyContribution)} a month to reach ${formatCurrency(view.target)} in ${formatDuration(view.months)}.`
    : `Saving ${formatCurrency(view.monthlyContribution)} a month reaches ${formatCurrency(view.target)} in ${formatDuration(view.months)}.`;
}

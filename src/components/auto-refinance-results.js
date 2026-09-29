/**
 * Results panel for the Auto Loan Refinance Calculator. Pure function of the
 * view model from src/adapters/auto-loan-refinance.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';
import { aheadText } from './refinance-results.js';

const signed = (value) => `${value >= 0 ? '+' : '−'}${formatCurrency(Math.abs(value))}`;

function paymentChange(view) {
  const change = view.monthlySavings;
  if (Math.abs(change) < 0.005) return { label: 'Monthly payment change', value: formatCurrency(0), note: 'Same payment' };
  return change > 0
    ? { label: 'Monthly savings', value: formatCurrency(change), note: `Down from ${formatCurrency(view.current.payment)}` }
    : { label: 'Monthly payment increase', value: formatCurrency(-change), note: `Up from ${formatCurrency(view.current.payment)}` };
}

function summary(view) {
  const stats = [
    { label: 'New monthly payment', value: formatCurrency(view.refinance.payment), primary: true, note: `Over ${formatDuration(view.refinance.months)}` },
    paymentChange(view),
    { label: 'Total savings over the loan', value: signed(view.lifetimeSavings), note: 'Both loans run to payoff, costs included' },
    { label: 'True break-even', value: aheadText(view), note: 'Counts the balance still owed' }
  ];
  if (view.refinance.cashCosts > 0) {
    stats.push({
      label: 'Simple break-even',
      value: view.simpleBreakEvenMonths === null ? 'Not reached' : `${view.simpleBreakEvenMonths.toFixed(1)} months`,
      note: 'Cash costs ÷ monthly savings'
    });
  }
  if (view.keep) {
    stats.push({ label: `Net savings if you sell after ${formatDuration(view.keep.months)}`, value: signed(view.keep.netSavings), note: 'Counts the balance owed then' });
  }
  return statGrid(stats);
}

function verdictNote(view) {
  const window = view.aheadWindow;
  if (!window) {
    return html`<p class="callout callout--warning"><strong>This refinance never comes out ahead.</strong> At every point, keeping your current loan costs less
    once refinance costs and the balance still owed are counted${view.monthlySavings > 0 ? ', even though the monthly payment is lower' : ''}.</p>`;
  }
  if (window.untilMonth !== null) {
    return html`<p class="callout callout--warning"><strong>Ahead only for a while.</strong> Refinancing comes out ahead if you sell or pay off between
    month ${window.fromMonth} and month ${window.untilMonth}. Run to payoff, refinancing costs ${formatCurrency(-view.lifetimeSavings)} more
    than keeping your loan${view.extraMonths > 0 ? html`, because of the ${formatDuration(view.extraMonths)} of extra payments` : ''}.</p>`;
  }
  if (view.lifetimeSavings <= 0) {
    return html`<p class="callout callout--warning"><strong>Lower payment, higher total cost.</strong> Refinancing costs ${formatCurrency(-view.lifetimeSavings)} more over the loan.</p>`;
  }
  return html`<p class="callout">Refinancing comes out ahead from <strong>month ${window.fromMonth}</strong> and saves
  <strong>${formatCurrency(view.lifetimeSavings)}</strong> if you keep both loans to payoff.</p>`;
}

function loanComparison(view) {
  const { current, refinance } = view;
  return dataTable({
    id: 'auto-refi-compare',
    title: 'Current loan vs. refinance, run to payoff',
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'current', label: 'Keep current loan', numeric: true },
      { key: 'refinance', label: 'Refinance', numeric: true }
    ],
    rows: [
      { item: 'Monthly payment', current: formatCurrency(current.payment), refinance: formatCurrency(refinance.payment) },
      { item: 'Loan amount', current: formatCurrency(view.input.currentBalance), refinance: formatCurrency(refinance.principal) },
      { item: 'Payments left', current: formatDuration(current.months), refinance: formatDuration(refinance.months) },
      { item: 'Total interest', current: formatCurrency(current.totalInterest), refinance: formatCurrency(refinance.totalInterest) },
      { item: 'Fees and penalty paid in cash', current: formatCurrency(0), refinance: formatCurrency(refinance.cashCosts) },
      { item: 'Total cost to payoff', current: formatCurrency(current.totalCost), refinance: formatCurrency(refinance.totalCost), selected: true }
    ]
  });
}

function horizonTable(view) {
  return dataTable({
    id: 'auto-refi-horizon',
    title: 'If you sell, trade in or pay off after…',
    columns: [
      { key: 'after', label: 'After' },
      { key: 'net', label: 'Refinance ahead by', numeric: true },
      { key: 'currentCost', label: 'Keep: paid + owed', numeric: true },
      { key: 'refinanceCost', label: 'Refinance: paid + owed', numeric: true },
      { key: 'currentOwed', label: 'Keep: balance owed', numeric: true },
      { key: 'refinanceOwed', label: 'Refinance: balance owed', numeric: true }
    ],
    rows: view.horizon.map((row) => ({
      after: `${formatDuration(row.month)}${row.isKeep ? ' (your plan)' : ''}`,
      net: signed(row.netSavings),
      currentCost: formatCurrency(row.current.cost),
      refinanceCost: formatCurrency(row.refinance.cost),
      currentOwed: formatCurrency(row.current.balance),
      refinanceOwed: formatCurrency(row.refinance.balance),
      selected: row.isKeep
    }))
  });
}

export function autoRefinanceResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your refinance estimate</h2>
  ${summary(view)}
  ${verdictNote(view)}
  <p class="note">Principal and interest only. Insurance, taxes and add-on products are not included.</p>
</section>
<section class="result-block" aria-labelledby="horizon-heading">
  <h2 id="horizon-heading">If you sell or trade in early</h2>
  <p class="note">Each option's cost at that point is the payments made so far, plus the balance you would still owe, plus fees paid in cash.</p>
  ${horizonTable(view)}
</section>
<section class="result-block" aria-labelledby="compare-loans-heading">
  <h2 id="compare-loans-heading">Keep vs. refinance over the full term</h2>
  ${loanComparison(view)}
  ${view.extraMonths > 0 ? html`<p class="note">The new loan runs ${formatDuration(view.extraMonths)} longer than the time left on your current loan.</p>` : ''}
</section>`;
}

export function autoRefinanceQuickResult(view) {
  return html`<strong>${formatCurrency(view.refinance.payment)}</strong>/month · total savings ${signed(view.lifetimeSavings)}.
  <a href="#summary-heading">See full results</a>`;
}

export function autoRefinanceAnnouncement(view) {
  return `New monthly payment ${formatCurrency(view.refinance.payment)}. Total savings over the loan ${signed(view.lifetimeSavings)}. True break-even: ${aheadText(view)}.`;
}

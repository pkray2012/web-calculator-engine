/**
 * Results panel for the Mortgage Refinance Calculator. Pure function of the
 * view model from src/adapters/mortgage-refinance.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const signed = (value) => `${value >= 0 ? '+' : '−'}${formatCurrency(Math.abs(value))}`;

/** Plain-language true break-even, used in stats, announcements and copy. */
export function aheadText(view) {
  const window = view.aheadWindow;
  if (!window) return 'Never ahead within the loan terms';
  if (window.untilMonth === null) return `From month ${window.fromMonth}`;
  return `Months ${window.fromMonth}–${window.untilMonth} only`;
}

function paymentChange(view) {
  const change = view.monthlySavings;
  if (Math.abs(change) < 0.005) return { label: 'Monthly payment change', value: formatCurrency(0), note: 'Same payment' };
  return change > 0
    ? { label: 'Monthly savings', value: formatCurrency(change), note: `Down from ${formatCurrency(view.current.payment)}` }
    : { label: 'Monthly payment increase', value: formatCurrency(-change), note: `Up from ${formatCurrency(view.current.payment)}` };
}

function summary(view) {
  const stats = [
    { label: 'New monthly payment', value: formatCurrency(view.refinance.payment), primary: true, note: `Principal and interest over ${formatDuration(view.refinance.months)}` },
    paymentChange(view),
    { label: 'True break-even', value: aheadText(view), note: 'Counts the balance still owed' },
    {
      label: 'Simple break-even',
      value: view.simpleBreakEvenMonths === null ? 'Not reached' : `${view.simpleBreakEvenMonths.toFixed(1)} months`,
      note: 'Closing costs ÷ monthly savings'
    },
    { label: 'Lifetime net savings', value: signed(view.lifetimeSavings), note: 'Both loans run to payoff' }
  ];
  if (view.stay) {
    stats.push({ label: `Net savings if you keep it ${formatDuration(view.stay.months)}`, value: signed(view.stay.netSavings), note: 'Including the balance owed then' });
  }
  return statGrid(stats);
}

function verdictNote(view) {
  const window = view.aheadWindow;
  if (!window) {
    return html`<p class="callout callout--warning"><strong>This refinance never comes out ahead.</strong> At every point before both loans are paid off,
    keeping your current loan costs less once closing costs and the balance still owed are counted${view.monthlySavings > 0 ? ', even though the monthly payment is lower' : ''}.</p>`;
  }
  if (window.untilMonth !== null) {
    return html`<p class="callout callout--warning"><strong>Ahead only for a while.</strong> Refinancing comes out ahead if you sell or pay off between
    month ${window.fromMonth} and month ${window.untilMonth}. After that, the longer new term costs more than it saves: over both full terms you would pay
    ${formatCurrency(-view.lifetimeSavings)} more.</p>`;
  }
  return html`<p class="callout">Refinancing comes out ahead from <strong>month ${window.fromMonth}</strong> onward and saves
  <strong>${formatCurrency(view.lifetimeSavings)}</strong> if both loans run to payoff.</p>`;
}

function loanComparison(view) {
  const { current, refinance } = view;
  const rows = [
    { item: 'Monthly payment (principal and interest)', current: formatCurrency(current.payment), refinance: formatCurrency(refinance.payment) },
    { item: 'Loan amount', current: formatCurrency(view.input.currentBalance), refinance: formatCurrency(refinance.principal) },
    { item: 'Time to pay off', current: formatDuration(current.months), refinance: formatDuration(refinance.months) },
    { item: 'Total interest', current: formatCurrency(current.totalInterest), refinance: formatCurrency(refinance.totalInterest) },
    { item: 'Closing costs paid in cash', current: formatCurrency(0), refinance: formatCurrency(refinance.cashCosts) },
    { item: 'Total cost to payoff', current: formatCurrency(current.totalCost), refinance: formatCurrency(refinance.totalCost), selected: true }
  ];
  return dataTable({
    id: 'loan-compare',
    title: 'Current loan vs. refinance, run to payoff',
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'current', label: 'Keep current loan', numeric: true },
      { key: 'refinance', label: 'Refinance', numeric: true }
    ],
    rows
  });
}

function horizonTable(view) {
  return dataTable({
    id: 'horizon-table',
    title: 'If you sell or pay off after…',
    columns: [
      { key: 'after', label: 'After' },
      { key: 'net', label: 'Refinance ahead by', numeric: true },
      { key: 'currentCost', label: 'Keep: paid + owed', numeric: true },
      { key: 'refinanceCost', label: 'Refinance: paid + owed', numeric: true },
      { key: 'currentOwed', label: 'Keep: balance owed', numeric: true },
      { key: 'refinanceOwed', label: 'Refinance: balance owed', numeric: true }
    ],
    rows: view.horizon.map((row) => ({
      after: `${formatDuration(row.month)}${row.isStay ? ' (your plan)' : ''}`,
      currentCost: formatCurrency(row.current.cost),
      refinanceCost: formatCurrency(row.refinance.cost),
      net: signed(row.netSavings),
      currentOwed: formatCurrency(row.current.balance),
      refinanceOwed: formatCurrency(row.refinance.balance),
      selected: row.isStay
    }))
  });
}

export function refinanceResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your refinance estimate</h2>
  ${summary(view)}
  ${verdictNote(view)}
  <p class="note">Principal and interest only. Taxes, insurance, PMI and escrow are not included.</p>
</section>
<section class="result-block" aria-labelledby="horizon-heading">
  <h2 id="horizon-heading">If you sell or pay off early</h2>
  <p class="note">Each option's cost at that point is the payments made so far, plus the balance you would still owe, plus closing costs paid in cash.</p>
  ${horizonTable(view)}
</section>
<section class="result-block" aria-labelledby="compare-loans-heading">
  <h2 id="compare-loans-heading">Keep vs. refinance over the full term</h2>
  ${loanComparison(view)}
  ${view.termReset ? html`<p class="note">The new term is longer than the time left on your current loan, so you would make payments for
  ${formatDuration(view.refinance.months - view.current.months)} longer.</p>` : ''}
</section>`;
}

export function refinanceQuickResult(view) {
  return html`<strong>${formatCurrency(view.refinance.payment)}</strong>/month · true break-even: ${aheadText(view).toLowerCase()}.
  <a href="#summary-heading">See full results</a>`;
}

export function refinanceAnnouncement(view) {
  return `New monthly payment ${formatCurrency(view.refinance.payment)}. True break-even: ${aheadText(view)}. Lifetime net savings ${signed(view.lifetimeSavings)}.`;
}

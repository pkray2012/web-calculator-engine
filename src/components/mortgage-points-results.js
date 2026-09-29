/**
 * Results panel for the Mortgage Points Calculator. Pure function of the
 * view model from src/adapters/mortgage-points.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const signed = (value) => `${value >= 0 ? '+' : '−'}${formatCurrency(Math.abs(value))}`;

/** Plain-language true break-even, used in stats, announcements and copy. */
export function pointsBreakEvenText(view) {
  if (view.breakEvenMonth === null) return 'Never within the loan term';
  return `Month ${view.breakEvenMonth} (${formatDuration(view.breakEvenMonth)})`;
}

function summary(view) {
  const stats = [
    { label: 'Break-even', value: pointsBreakEvenText(view), primary: true, note: 'First month the points have paid for themselves' },
    { label: 'Cost of the points', value: formatCurrency(view.pointsCost), note: `${view.input.points} × 1% of ${formatCurrency(view.input.loanAmount)}, paid at closing` },
    { label: 'Monthly payment savings', value: formatCurrency(view.monthlySavings), note: `${formatCurrency(view.basePayment)} → ${formatCurrency(view.pointsPayment)}` },
    {
      label: 'Simple break-even',
      value: view.simpleBreakEvenMonths === null ? 'Not reached' : `${view.simpleBreakEvenMonths.toFixed(1)} months`,
      note: 'Points cost ÷ monthly savings'
    },
    { label: 'Net savings over the full term', value: signed(view.lifetimeSavings), note: 'Interest saved minus the points' }
  ];
  if (view.stay) {
    stats.push({ label: `Net savings if you keep it ${formatDuration(view.stay.months)}`, value: signed(view.stay.netSavings), note: 'Counts the balance owed then' });
  }
  return statGrid(stats);
}

function verdictNote(view) {
  if (view.breakEvenMonth === null) {
    return html`<p class="callout callout--warning"><strong>These points never pay for themselves.</strong>
    The lower rate does not save more interest than the ${formatCurrency(view.pointsCost)} they cost before the loan is paid off.</p>`;
  }
  if (view.stay && view.stay.netSavings <= 0) {
    return html`<p class="callout callout--warning"><strong>If you keep the loan ${formatDuration(view.stay.months)}, the points cost
    ${formatCurrency(-view.stay.netSavings)} more than they save.</strong> They break even in month ${view.breakEvenMonth}.</p>`;
  }
  const simple = view.simpleBreakEvenMonths;
  const sooner = simple !== null && view.breakEvenMonth < Math.ceil(simple)
    ? html` The simple rule of thumb says ${simple.toFixed(1)} months; counting the lower balance you would owe, it is ${Math.ceil(simple) - view.breakEvenMonth} months sooner.`
    : '';
  return html`<p class="callout">The points pay for themselves in <strong>month ${view.breakEvenMonth}</strong>
  ${view.stay ? html`and save <strong>${formatCurrency(view.stay.netSavings)}</strong> if you keep the loan ${formatDuration(view.stay.months)}` : html`and save <strong>${formatCurrency(view.lifetimeSavings)}</strong> over the full term`}.${sooner}</p>`;
}

function horizonTable(view) {
  return dataTable({
    id: 'points-horizon',
    title: 'If you sell, refinance or pay off after…',
    columns: [
      { key: 'after', label: 'After' },
      { key: 'net', label: 'Points ahead by', numeric: true },
      { key: 'baseCost', label: 'No points: paid + owed', numeric: true },
      { key: 'pointsCost', label: 'With points: paid + owed', numeric: true },
      { key: 'baseOwed', label: 'No points: balance owed', numeric: true },
      { key: 'pointsOwed', label: 'With points: balance owed', numeric: true }
    ],
    rows: view.horizon.map((row) => ({
      after: `${formatDuration(row.month)}${row.isStay ? ' (your plan)' : ''}`,
      net: signed(row.netSavings),
      baseCost: formatCurrency(row.current.cost),
      pointsCost: formatCurrency(row.refinance.cost),
      baseOwed: formatCurrency(row.current.balance),
      pointsOwed: formatCurrency(row.refinance.balance),
      selected: row.isStay
    }))
  });
}

function loanComparison(view) {
  return dataTable({
    id: 'points-compare',
    title: 'No points vs. points, run to payoff',
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'base', label: 'No points', numeric: true },
      { key: 'points', label: 'With points', numeric: true }
    ],
    rows: [
      { item: 'Interest rate', base: `${view.input.baseRate}%`, points: `${view.input.pointsRate}%` },
      { item: 'Monthly payment (principal and interest)', base: formatCurrency(view.basePayment), points: formatCurrency(view.pointsPayment) },
      { item: 'Points paid at closing', base: formatCurrency(0), points: formatCurrency(view.pointsCost) },
      { item: 'Total interest', base: formatCurrency(view.baseTotalInterest), points: formatCurrency(view.pointsTotalInterest) },
      { item: 'Interest + points', base: formatCurrency(view.baseTotalInterest), points: formatCurrency(view.pointsTotalInterest + view.pointsCost), selected: true }
    ]
  });
}

export function mortgagePointsResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your points estimate</h2>
  ${summary(view)}
  ${verdictNote(view)}
  <p class="note">Principal and interest only, same loan amount and term for both quotes. Taxes, insurance, PMI and other closing costs are not included.</p>
</section>
<section class="result-block" aria-labelledby="horizon-heading">
  <h2 id="horizon-heading">If you sell, refinance or pay off early</h2>
  <p class="note">Each option's cost at that point is the payments made so far plus the balance you would still owe, plus the points for the points option.</p>
  ${horizonTable(view)}
</section>
<section class="result-block" aria-labelledby="compare-heading">
  <h2 id="compare-heading">Over the full term</h2>
  ${loanComparison(view)}
</section>`;
}

export function mortgagePointsQuickResult(view) {
  return html`Break-even: <strong>${pointsBreakEvenText(view).toLowerCase()}</strong> · saves ${formatCurrency(view.monthlySavings)}/month.
  <a href="#summary-heading">See full results</a>`;
}

export function mortgagePointsAnnouncement(view) {
  return `Points cost ${formatCurrency(view.pointsCost)}. Break-even: ${pointsBreakEvenText(view)}. Monthly savings ${formatCurrency(view.monthlySavings)}.`;
}

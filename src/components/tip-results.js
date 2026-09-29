/**
 * Results panel for the Tip Calculator. Pure function of the view model
 * from src/adapters/tip.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';
import { calculateTip } from '../calculators/tip.js';

export const TIP_PERCENTS = [10, 15, 18, 20, 22, 25];
const pct = (value) => `${Number(value.toFixed(1)).toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;

export function tipResults(view) {
  const { input } = view;
  const split = view.people > 1;
  const base = input.tipOnPreTax ? `${formatCurrency(view.tipBase)} before tax` : formatCurrency(view.bill);
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your tip</h2>
  ${statGrid([
    split
      ? { label: 'Each person pays', value: formatCurrency(view.perPerson), primary: true, note: `${view.people} people, ${formatCurrency(view.total)} in total` }
      : { label: 'Total with tip', value: formatCurrency(view.total), primary: true, note: `${formatCurrency(view.bill)} + ${formatCurrency(view.tip)} tip` },
    { label: 'Tip', value: formatCurrency(view.tip), note: input.roundUp ? `${pct(view.effectiveTipPercent)} of ${base} after rounding up` : `${pct(view.tipPercent)} of ${base}` },
    ...(split ? [{ label: 'Total with tip', value: formatCurrency(view.total), note: `${formatCurrency(view.bill)} + ${formatCurrency(view.tip)} tip` }] : [])
  ])}
  ${view.extra > 0 ? html`<p class="note">Shares are rounded up to the cent, so together they come to ${formatCurrency(view.collected)}, ${formatCurrency(view.extra)} more than the total.</p>` : ''}
  ${dataTable({
    id: 'tip-table',
    title: `Tip on this bill${split ? ' and each share' : ''}`,
    columns: [{ key: 'pct', label: 'Tip' }, { key: 'tip', label: 'Tip amount', numeric: true }, { key: 'total', label: 'Total', numeric: true }, ...(split ? [{ key: 'each', label: 'Each person', numeric: true }] : [])],
    rows: TIP_PERCENTS.map((p) => {
      const row = calculateTip({ ...input, tipPercent: p, roundUp: false });
      return { pct: `${p}%`, tip: formatCurrency(row.tip), total: formatCurrency(row.total), each: formatCurrency(row.perPerson), ...(p === input.tipPercent && !input.roundUp ? { selected: true } : {}) };
    })
  })}
</section>`;
}

export function tipQuickResult(view) {
  if (view.people > 1) return html`<strong>${formatCurrency(view.perPerson)} each</strong> (${formatCurrency(view.tip)} tip, ${formatCurrency(view.total)} total). <a href="#summary-heading">See full results</a>`;
  return html`<strong>${formatCurrency(view.tip)} tip</strong>, ${formatCurrency(view.total)} total. <a href="#summary-heading">See full results</a>`;
}

export function tipAnnouncement(view) {
  return `Tip ${formatCurrency(view.tip)}, total ${formatCurrency(view.total)}${view.people > 1 ? `, ${formatCurrency(view.perPerson)} each for ${view.people} people` : ''}.`;
}

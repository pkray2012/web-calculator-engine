/**
 * Results panel for the Board Foot Calculator. Pure function of the view
 * model from src/adapters/board-foot.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const bf = (value) => `${value.toFixed(2)} bd ft`;
const inches = (value) => (Number.isInteger(value * 4) && !Number.isInteger(value) ? `${value * 4}/4` : `${value}`);

export function boardFootResults(view) {
  const { input } = view;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your board feet</h2>
  ${statGrid([
    { label: 'Board feet to buy', value: bf(view.withWaste), primary: true, note: `${bf(view.total)} plus ${input.wastePercent}% extra` },
    { label: 'Volume', value: `${view.cubicFeet.toFixed(2)} cu ft`, note: `${view.linearFeet} linear feet of boards` },
    ...(view.cost !== null ? [{ label: 'Lumber cost', value: formatCurrency(view.cost), note: `At ${formatCurrency(input.pricePerBoardFoot)} per board foot` }] : [])
  ])}
  ${dataTable({
    id: 'bf-rows',
    title: 'Board feet by stack',
    columns: [
      { key: 'stack', label: 'Stack' },
      { key: 'size', label: 'Size' },
      { key: 'each', label: 'Each', numeric: true },
      { key: 'total', label: 'Total', numeric: true }
    ],
    rows: [
      ...view.rows.map((row) => ({ stack: `${row.quantity} × stack ${row.row}`, size: `${inches(row.thicknessInches)} in × ${row.widthInches} in × ${row.lengthFeet} ft`, each: bf(row.each), total: bf(row.total) })),
      { stack: 'Total', size: '', each: '', total: bf(view.total), selected: true }
    ]
  })}
  ${view.cost === null ? html`<p class="note">Add a price per board foot to estimate the cost.</p>` : ''}
</section>`;
}

export function boardFootQuickResult(view) {
  return html`<strong>${bf(view.withWaste)}</strong> including ${view.input.wastePercent}% extra (${bf(view.total)} net). <a href="#summary-heading">See full results</a>`;
}

export function boardFootAnnouncement(view) {
  return `${bf(view.total)} of lumber, ${bf(view.withWaste)} with ${view.input.wastePercent}% extra.`;
}

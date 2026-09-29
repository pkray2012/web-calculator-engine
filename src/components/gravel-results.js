/**
 * Results panel for the Gravel Calculator. Pure function of the view model
 * from src/adapters/gravel.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const tons = (value) => `${value.toFixed(2)} tons`;
const yards = (value) => `${value.toFixed(2)} cu yd`;

function costRows(view) {
  const rows = [];
  if (view.costByTon !== null) rows.push({ item: 'Priced by the ton', amount: formatCurrency(view.costByTon) });
  if (view.costByYard !== null) rows.push({ item: 'Priced by the cubic yard', amount: formatCurrency(view.costByYard) });
  return rows;
}

export function gravelResults(view) {
  const costs = costRows(view);
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your gravel estimate</h2>
  ${statGrid([
    { label: 'Gravel to order', value: tons(view.tons), primary: true, note: `About ${formatCount(Math.round(view.pounds))} lb at ${view.input.tonsPerYard} tons per cubic yard` },
    { label: 'Volume', value: yards(view.cubicYards), note: `${view.cubicFeet.toFixed(1)} cu ft, including ${view.input.extraPercent}% extra` },
    { label: 'Area', value: `${formatCount(Math.round(view.area))} sq ft`, note: `One ton covers about ${formatCount(Math.round(view.squareFeetPerTon))} sq ft at ${view.input.depthInches} in deep` }
  ])}
  ${costs.length ? dataTable({
    id: 'gravel-cost',
    title: 'Material cost, including delivery',
    columns: [{ key: 'item', label: 'Pricing' }, { key: 'amount', label: 'Cost', numeric: true }],
    rows: costs
  }) : html`<p class="note">Add a price per ton or per cubic yard to estimate the cost.</p>`}
  <p class="note">Densities vary with the stone, size and moisture. Confirm the tons per cubic yard with your supplier before ordering.</p>
</section>`;
}

export function gravelQuickResult(view) {
  return html`<strong>${tons(view.tons)}</strong> · ${yards(view.cubicYards)}. <a href="#summary-heading">See full results</a>`;
}

export function gravelAnnouncement(view) {
  return `About ${tons(view.tons)}, or ${yards(view.cubicYards)}, of gravel.`;
}

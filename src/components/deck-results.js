/**
 * Results panel for the Deck Calculator. Pure function of the view model
 * from src/adapters/deck.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const feet = (value) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });

export function deckResults(view) {
  const { input } = view;
  const priced = view.totalCost !== null;
  const row = (item, count, cost) => ({ item, count, cost: priced ? formatCurrency(cost) : '—' });
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your deck materials</h2>
  ${statGrid([
    { label: 'Deck boards', value: formatCount(view.boards), primary: true, note: `${input.boardLengthFeet}-ft boards: ${formatCount(view.boardsExact)} plus ${input.wastePercent}% extra` },
    { label: 'Deck area', value: `${feet(view.areaSquareFeet)} sq ft`, note: `${feet(input.widthFeet)} × ${feet(input.depthFeet)} ft` },
    { label: 'Joists', value: formatCount(view.joists), note: `${feet(view.joistLengthFeet)} ft long, ${input.joistSpacingInches} in. on center` },
    { label: 'Deck screws', value: formatCount(view.screws), note: `${input.screwsPerCrossing} per board at each joist` }
  ])}
  ${dataTable({
    id: 'deck-materials',
    title: 'Materials list',
    columns: [{ key: 'item', label: 'Item' }, { key: 'count', label: 'Quantity', numeric: true }, { key: 'cost', label: 'Cost', numeric: true }],
    rows: [
      row(`Deck boards (${input.boardLengthFeet} ft)`, formatCount(view.boards), view.costs.boards),
      row(`Joists (${feet(view.joistLengthFeet)} ft)`, formatCount(view.joists), view.costs.joists),
      { item: 'Deck screws', count: formatCount(view.screws), cost: '—' },
      ...(priced ? [{ item: 'Total', count: '', cost: formatCurrency(view.totalCost), selected: true }] : [])
    ]
  })}
  <p class="note">${formatCount(view.rows)} rows of boards, ${formatCount(view.boardsPerRow)} ${view.boardsPerRow === 1 ? 'board' : 'boards'} per row: ${formatCount(Math.round(view.linearFeet))} linear feet of decking before waste.
  ${priced ? '' : 'Add prices to estimate the cost of materials. '}Beams, posts, footings, ledger, rim joists, stairs and railings are not included.</p>
</section>`;
}

export function deckQuickResult(view) {
  return html`<strong>${formatCount(view.boards)} deck boards</strong>, ${formatCount(view.joists)} joists and ${formatCount(view.screws)} screws. <a href="#summary-heading">See full results</a>`;
}

export function deckAnnouncement(view) {
  return `${formatCount(view.boards)} deck boards, ${formatCount(view.joists)} joists and ${formatCount(view.screws)} screws for a ${feet(view.areaSquareFeet)} square foot deck.`;
}

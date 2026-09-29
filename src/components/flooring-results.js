/**
 * Results panel for the Flooring Calculator. Pure function of the view model
 * from src/adapters/flooring.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const sqft = (value) => `${value.toFixed(1)} sq ft`;

export function flooringResults(view) {
  const costs = [
    ...(view.costBySquareFoot !== null ? [{ item: 'At your price per square foot', amount: formatCurrency(view.costBySquareFoot) }] : []),
    ...(view.costByBox !== null ? [{ item: 'At your price per box', amount: formatCurrency(view.costByBox) }] : [])
  ];
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your flooring estimate</h2>
  ${statGrid([
    { label: 'Boxes to buy', value: formatCount(view.boxes), primary: true, note: `At ${view.input.boxCoverage} sq ft per box` },
    { label: 'Floor area', value: sqft(view.area), note: `${sqft(view.areaWithWaste)} with ${view.input.wastePercent}% extra` },
    { label: 'Left over', value: sqft(view.leftover), note: `The boxes cover ${sqft(view.purchased)}` }
  ])}
  ${view.roomAreas.length > 1 ? dataTable({
    id: 'floor-rooms',
    title: 'Area by room',
    columns: [{ key: 'room', label: 'Room' }, { key: 'size', label: 'Size' }, { key: 'area', label: 'Area', numeric: true }],
    rows: [
      ...view.input.rooms.map((room, index) => ({ room: `Room ${room.room}`, size: `${room.lengthFeet} × ${room.widthFeet} ft`, area: sqft(view.roomAreas[index]) })),
      { room: 'Total', size: '', area: sqft(view.area), selected: true }
    ]
  }) : ''}
  ${costs.length ? dataTable({
    id: 'floor-cost',
    title: 'Material cost for the boxes you buy',
    columns: [{ key: 'item', label: 'Pricing' }, { key: 'amount', label: 'Cost', numeric: true }],
    rows: costs
  }) : html`<p class="note">Add a price per square foot or per box to estimate the cost.</p>`}
  <p class="note">Keep a box or two of leftovers for future repairs; dye lots can change.</p>
</section>`;
}

export function flooringQuickResult(view) {
  return html`<strong>${formatCount(view.boxes)} boxes</strong> for ${sqft(view.area)}. <a href="#summary-heading">See full results</a>`;
}

export function flooringAnnouncement(view) {
  return `${formatCount(view.boxes)} boxes of flooring for ${sqft(view.area)}, including ${view.input.wastePercent}% extra.`;
}

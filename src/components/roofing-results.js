/**
 * Results panel for the Roofing Calculator. Pure function of the view model
 * from src/adapters/roofing.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const sqft = (value) => `${value.toFixed(1)} sq ft`;
const squares = (value) => `${value.toFixed(2)} squares`;

export function roofingResults(view) {
  const { input } = view;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your roofing estimate</h2>
  ${statGrid([
    { label: 'Bundles to buy', value: formatCount(view.bundles), primary: true, note: `At ${input.bundlesPerSquare} bundles per square` },
    { label: 'Roof area', value: sqft(view.roofArea), note: `${squares(view.squares)}; ${squares(view.squaresWithWaste)} with ${input.wastePercent}% extra` },
    ...(view.cost !== null ? [{ label: 'Shingle cost', value: formatCurrency(view.cost), note: `At ${formatCurrency(input.pricePerBundle)} a bundle` }] : [])
  ])}
  ${dataTable({
    id: 'roof-area',
    title: 'From footprint to bundles',
    columns: [{ key: 'item', label: 'Step' }, { key: 'value', label: 'Value', numeric: true }],
    rows: [
      { item: `Footprint (${input.lengthFeet} × ${input.widthFeet} ft)`, value: sqft(view.footprint) },
      { item: `Pitch factor for ${input.pitchRise} in 12`, value: view.pitchFactor.toFixed(4) },
      { item: 'Roof area', value: sqft(view.roofArea) },
      { item: `With ${input.wastePercent}% extra`, value: squares(view.squaresWithWaste) },
      { item: 'Bundles, rounded up', value: formatCount(view.bundles), selected: true }
    ]
  })}
  ${view.cost === null ? html`<p class="note">Add a price per bundle to estimate the cost.</p>` : ''}
  <p class="note">Ridge caps, starter strip, underlayment, flashing and nails are sold separately.</p>
</section>`;
}

export function roofingQuickResult(view) {
  return html`<strong>${formatCount(view.bundles)} bundles</strong> for ${squares(view.squares)} of roof. <a href="#summary-heading">See full results</a>`;
}

export function roofingAnnouncement(view) {
  return `${formatCount(view.bundles)} bundles of shingles for ${view.squares.toFixed(2)} squares of roof, including ${view.input.wastePercent}% extra.`;
}

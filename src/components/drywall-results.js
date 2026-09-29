/**
 * Results panel for the Drywall Calculator. Pure function of the view model
 * from src/adapters/drywall.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const sqft = (value) => `${value.toFixed(1)} sq ft`;
const sheetLabel = (id) => id.replace('x', ' × ') + ' ft';

export function drywallResults(view) {
  const { input } = view;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your drywall estimate</h2>
  ${statGrid([
    { label: 'Sheets to buy', value: formatCount(view.sheets), primary: true, note: `${sheetLabel(input.sheet)} sheets, ${view.sheetArea} sq ft each` },
    { label: 'Area to cover', value: sqft(view.area), note: `${sqft(view.areaWithWaste)} with ${input.wastePercent}% extra` },
    ...(view.cost !== null ? [{ label: 'Drywall cost', value: formatCurrency(view.cost), note: `At ${formatCurrency(input.pricePerSheet)} a sheet` }] : [])
  ])}
  ${dataTable({
    id: 'drywall-area',
    title: 'How the area adds up',
    columns: [{ key: 'item', label: 'Surface' }, { key: 'area', label: 'Area', numeric: true }],
    rows: [
      { item: `Walls (${input.lengthFeet} + ${input.widthFeet}) × 2 × ${input.heightFeet} ft`, area: sqft(view.grossWallArea) },
      { item: 'Less doors and windows', area: `−${sqft(view.openingsArea)}` },
      { item: 'Ceiling', area: input.includeCeiling ? sqft(view.ceilingArea) : 'Not included' },
      { item: 'Total to cover', area: sqft(view.area), selected: true }
    ]
  })}
  ${dataTable({
    id: 'drywall-sizes',
    title: 'Sheets needed by size',
    columns: [{ key: 'size', label: 'Sheet size' }, { key: 'sheets', label: 'Sheets', numeric: true }],
    rows: view.options.map((option) => ({ size: `${sheetLabel(option.id)} (${option.sheetArea} sq ft)`, sheets: formatCount(option.sheets), selected: option.id === input.sheet }))
  })}
  ${view.cost === null ? html`<p class="note">Add a price per sheet to estimate the cost.</p>` : ''}
</section>`;
}

export function drywallQuickResult(view) {
  return html`<strong>${formatCount(view.sheets)} sheets</strong> of ${sheetLabel(view.input.sheet)} drywall for ${sqft(view.area)}. <a href="#summary-heading">See full results</a>`;
}

export function drywallAnnouncement(view) {
  return `${formatCount(view.sheets)} sheets of ${sheetLabel(view.input.sheet)} drywall for ${sqft(view.area)}, including ${view.input.wastePercent}% extra.`;
}

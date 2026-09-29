/**
 * Results panel for the Square Footage Calculator. Pure function of the view
 * model from src/adapters/square-footage.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

export const num = (value, digits = 2) => value.toLocaleString('en-US', { maximumFractionDigits: digits });

export function squareFootageResults(view) {
  const { input } = view;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your area</h2>
  ${statGrid([
    { label: 'Square feet', value: `${num(view.squareFeet)} sq ft`, primary: true, note: input.count > 1 ? `${input.count} areas of ${num(view.eachSquareFeet)} sq ft` : 'Total area' },
    { label: 'Square meters', value: `${num(view.squareMeters)} m²`, note: '1 sq ft = 0.0929 m²' },
    ...(view.cost !== null ? [{ label: 'Cost', value: formatCurrency(view.cost), note: `At ${formatCurrency(input.pricePerSquareFoot)} per sq ft` }] : [])
  ])}
  ${dataTable({
    id: 'sqft-units',
    title: 'The same area in other units',
    columns: [{ key: 'unit', label: 'Unit' }, { key: 'value', label: 'Area', numeric: true }],
    rows: [
      { unit: 'Square feet', value: num(view.squareFeet), selected: true },
      { unit: 'Square inches', value: num(view.squareInches, 0) },
      { unit: 'Square yards', value: num(view.squareYards) },
      { unit: 'Square meters', value: num(view.squareMeters) },
      { unit: 'Acres', value: num(view.acres, 4) }
    ]
  })}
</section>`;
}

export function squareFootageQuickResult(view) {
  return html`<strong>${num(view.squareFeet)} sq ft</strong> (${num(view.squareMeters)} m²)${view.cost !== null ? html`, ${formatCurrency(view.cost)}` : ''}. <a href="#summary-heading">See full results</a>`;
}

export function squareFootageAnnouncement(view) {
  return `${num(view.squareFeet)} square feet, ${num(view.squareMeters)} square meters${view.cost !== null ? `, cost ${formatCurrency(view.cost)}` : ''}.`;
}

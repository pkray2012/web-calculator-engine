/**
 * Results panel for the Asphalt Calculator. Pure function of the view model
 * from src/adapters/asphalt.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

export const num = (value, digits = 2) => value.toLocaleString('en-US', { maximumFractionDigits: digits });

export function asphaltResults(view) {
  const { input } = view;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your asphalt</h2>
  ${statGrid([
    { label: 'Tons to order', value: `${num(view.tonsToOrder)} tons`, primary: true, note: `${num(view.tons)} tons plus ${num(input.wastePercent, 1)}% extra` },
    { label: 'Volume', value: `${num(view.cubicYards)} cu yd`, note: `${num(view.cubicFeet)} cu ft` },
    { label: 'Area', value: `${num(view.areaSquareFeet)} sq ft`, note: `${num(input.lengthFeet)} × ${num(input.widthFeet)} ft at ${num(input.thicknessInches)} in` },
    ...(view.cost !== null ? [{ label: 'Cost', value: formatCurrency(view.cost), note: `At ${formatCurrency(input.pricePerTon)} a ton` }] : [])
  ])}
  ${dataTable({
    id: 'asphalt-thickness',
    title: 'Tons for this area at other thicknesses',
    columns: [{ key: 't', label: 'Thickness' }, { key: 'tons', label: 'Tons (before extra)', numeric: true }, { key: 'order', label: `With ${num(input.wastePercent, 1)}% extra`, numeric: true }],
    rows: [2, 2.5, 3, 4, 6].map((t) => {
      const tons = (view.areaSquareFeet * (t / 12) * input.densityLbPerCuFt) / 2000;
      return { t: `${t} in`, tons: num(tons), order: num(tons * (1 + input.wastePercent / 100)), ...(t === input.thicknessInches ? { selected: true } : {}) };
    })
  })}
  <p class="note">Weight depends on the mix and compaction; confirm the density with your supplier. Base gravel is not included.</p>
</section>`;
}

export function asphaltQuickResult(view) {
  return html`<strong>${num(view.tonsToOrder)} tons</strong> of asphalt (${num(view.cubicYards)} cu yd)${view.cost !== null ? html`, ${formatCurrency(view.cost)}` : ''}. <a href="#summary-heading">See full results</a>`;
}

export function asphaltAnnouncement(view) {
  return `${num(view.tonsToOrder)} tons of asphalt to order, ${num(view.cubicYards)} cubic yards${view.cost !== null ? `, cost ${formatCurrency(view.cost)}` : ''}.`;
}

/**
 * Results panel for the Cubic Yard Calculator. Pure function of the view model
 * from src/adapters/cubic-yard.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const yards = (value) => `${value.toFixed(2)} cu yd`;
const feet = (value) => `${value.toFixed(1)} cu ft`;
const sqft = (value) => `${formatCount(Math.round(value))} sq ft`;

function orderRows(view) {
  const rows = [
    { item: 'Cubic feet', amount: feet(view.cubicFeet) },
    { item: 'Cubic meters', amount: `${view.cubicMeters.toFixed(2)} m³` }
  ];
  if (view.bags !== null) rows.push({ item: `Bags of ${view.input.bagCubicFeet} cu ft`, amount: formatCount(view.bags) });
  if (view.truckloads !== null) rows.push({ item: `Loads of ${view.input.truckYards} cu yd`, amount: formatCount(view.truckloads) });
  if (view.tons !== null) rows.push({ item: `Weight at ${view.input.tonsPerYard} tons per cu yd`, amount: `${view.tons.toFixed(2)} tons (${formatCount(Math.round(view.pounds))} lb)` });
  if (view.cost !== null) rows.push({ item: view.input.deliveryFee > 0 ? 'Cost, including delivery' : 'Cost', amount: formatCurrency(view.cost) });
  return rows;
}

function volumeStats(view) {
  const { input } = view;
  const areas = input.count > 1 ? `${input.count} areas of ${sqft(view.areaEach)} each` : 'One area';
  return [
    { label: 'Cubic yards to order', value: yards(view.cubicYards), primary: true, note: `${input.depthInches} in deep, including ${input.extraPercent}% extra` },
    { label: 'Area', value: sqft(view.area), note: areas },
    { label: 'Coverage per yard', value: sqft(view.squareFeetPerYard), note: `One cubic yard at ${input.depthInches} in deep, before the extra` }
  ];
}

function coverageStats(view) {
  const { input } = view;
  return [
    { label: 'Area covered', value: sqft(view.area), primary: true, note: `${yards(view.cubicYards)} at ${input.depthInches} in deep, after ${input.extraPercent}% set aside` },
    { label: 'About the size of', value: `${formatCount(Math.round(view.squareSideFeet))} × ${formatCount(Math.round(view.squareSideFeet))} ft`, note: 'A square with the same area' },
    { label: 'Coverage per yard', value: sqft(view.squareFeetPerYard), note: `One cubic yard at ${input.depthInches} in deep` }
  ];
}

export function cubicYardResults(view) {
  const coverage = view.mode === 'coverage';
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">${coverage ? 'Your coverage estimate' : 'Your cubic yard estimate'}</h2>
  ${statGrid(coverage ? coverageStats(view) : volumeStats(view))}
  ${dataTable({
    id: 'cy-order',
    title: coverage ? 'The volume in other units' : 'What to order',
    columns: [{ key: 'item', label: 'Measure' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows: orderRows(view)
  })}
  <p class="note">${view.tons === null ? 'Add the weight per cubic yard from your supplier to see tons. ' : ''}Suppliers round deliveries, often to the
  half or whole yard, and may have a minimum order.</p>
</section>`;
}

export function cubicYardQuickResult(view) {
  const main = view.mode === 'coverage' ? `${sqft(view.area)} covered` : `${yards(view.cubicYards)} to order`;
  return html`<strong>${main}</strong>. <a href="#summary-heading">See full results</a>`;
}

export function cubicYardAnnouncement(view) {
  return view.mode === 'coverage'
    ? `${yards(view.cubicYards)} covers about ${sqft(view.area)} at ${view.input.depthInches} inches deep.`
    : `You need about ${yards(view.cubicYards)}, or ${feet(view.cubicFeet)}.`;
}

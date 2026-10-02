/**
 * Results panel for the BTU Calculator. Pure function of the view model from
 * src/adapters/btu.js.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

export const btuText = (value) => `${formatCount(Math.round(value))} BTU`;
const signed = (value) => (value > 0 ? `+${btuText(value)}` : value < 0 ? `−${btuText(-value)}` : '0 BTU');
const SUN_LABEL = { shaded: 'Heavily shaded: −10%', average: 'Average sun: no change', sunny: 'Very sunny: +10%' };

function breakdownRows(view) {
  const { row, input } = view;
  return [
    { item: `Chart capacity for ${formatCount(row.fromSquareFeet)}–${formatCount(row.toSquareFeet)} sq ft`, amount: btuText(view.baseBtu) },
    { item: SUN_LABEL[input.sun], amount: signed(view.sunBtu) },
    { item: view.extraPeople > 0 ? `${view.extraPeople} ${view.extraPeople === 1 ? 'person' : 'people'} beyond two, 600 BTU each` : 'Two people or fewer: no change', amount: signed(view.peopleBtu) },
    { item: input.kitchen ? 'Kitchen' : 'Not a kitchen', amount: signed(view.kitchenBtu) },
    { item: 'Recommended capacity', amount: btuText(view.btu) }
  ];
}

export function btuResults(view) {
  const { input } = view;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your air conditioner size</h2>
  ${statGrid([
    { label: 'Cooling capacity', value: `${btuText(view.btu)} per hour`, primary: true, note: 'Choose a unit rated at or close to this' },
    { label: 'Room area', value: `${formatCount(Math.round(input.squareFeet))} sq ft`, note: input.measure === 'dims' ? `${input.lengthFeet} × ${input.widthFeet} ft` : 'As entered' },
    { label: 'In tons of cooling', value: `${view.tons.toFixed(2)} tons`, note: '1 ton = 12,000 BTU per hour' }
  ])}
  ${dataTable({
    id: 'btu-breakdown',
    title: 'How the size was worked out',
    columns: [{ key: 'item', label: 'Step' }, { key: 'amount', label: 'BTU per hour', numeric: true }],
    rows: breakdownRows(view)
  })}
  <p class="note">Based on the ENERGY STAR room air conditioner sizing chart for a room with ordinary ceilings and insulation. Unusual rooms, such as
  high ceilings, large windows or poor insulation, can need more.</p>
</section>`;
}

export function btuQuickResult(view) {
  return html`<strong>${btuText(view.btu)} per hour</strong> for ${formatCount(Math.round(view.input.squareFeet))} sq ft. <a href="#summary-heading">See full results</a>`;
}

export function btuAnnouncement(view) {
  return `About ${btuText(view.btu)} per hour of cooling for ${formatCount(Math.round(view.input.squareFeet))} square feet.`;
}

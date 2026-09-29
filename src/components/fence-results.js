/**
 * Results panel for the Fence Calculator. Pure function of the view model
 * from src/adapters/fence.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

export function fenceResults(view) {
  const { input } = view;
  const priced = view.totalCost !== null;
  const row = (item, count, cost) => ({ item, count: formatCount(count), cost: priced ? formatCurrency(cost) : '—' });
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your fence materials</h2>
  ${statGrid([
    { label: 'Pickets', value: formatCount(view.pickets), primary: true, note: `${formatCount(view.picketsExact)} to cover the line, plus ${input.wastePercent}% extra` },
    { label: 'Posts', value: formatCount(view.posts), note: `${formatCount(view.sections)} sections of ${view.sectionLengthFeet.toFixed(2)} ft` },
    { label: 'Rails', value: formatCount(view.rails), note: `${input.railsPerSection} per section` }
  ])}
  ${dataTable({
    id: 'fence-materials',
    title: 'Materials list',
    columns: [{ key: 'item', label: 'Item' }, { key: 'count', label: 'Quantity', numeric: true }, { key: 'cost', label: 'Cost', numeric: true }],
    rows: [
      row('Posts', view.posts, view.costs.posts),
      row('Rails', view.rails, view.costs.rails),
      row('Pickets', view.pickets, view.costs.pickets),
      ...(priced ? [{ item: 'Total', count: '', cost: formatCurrency(view.totalCost), selected: true }] : [])
    ]
  })}
  ${priced ? '' : html`<p class="note">Add prices to estimate the cost of materials.</p>`}
  <p class="note">Gates, post caps, concrete, fasteners and hardware are not included.</p>
</section>`;
}

export function fenceQuickResult(view) {
  return html`<strong>${formatCount(view.pickets)} pickets</strong>, ${formatCount(view.posts)} posts and ${formatCount(view.rails)} rails. <a href="#summary-heading">See full results</a>`;
}

export function fenceAnnouncement(view) {
  return `${formatCount(view.pickets)} pickets, ${formatCount(view.posts)} posts and ${formatCount(view.rails)} rails for ${view.input.lengthFeet} feet of fence.`;
}

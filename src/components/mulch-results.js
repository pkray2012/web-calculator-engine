/**
 * Results panel for the Mulch Calculator. Pure function of the view model
 * from src/adapters/mulch.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid } from './results.js';

const yards = (value) => `${value.toFixed(2)} cu yd`;

export function mulchResults(view) {
  const { bag } = view;
  const cost = view.comparable
    ? html`<p class="callout"><strong>${bag.cost <= view.bulkCost ? 'Bags' : 'Bulk delivery'}</strong> cost less for this job:
      ${formatCurrency(bag.cost)} for ${formatCount(bag.count)} bags vs. ${formatCurrency(view.bulkCost)} delivered in bulk.</p>`
    : html`<p class="note">Add a bag price and a bulk price per cubic yard to compare the cost.</p>`;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your mulch estimate</h2>
  ${statGrid([
    { label: 'Mulch needed', value: yards(view.cubicYards), primary: true, note: `${view.cubicFeet.toFixed(1)} cu ft for ${formatCount(Math.round(view.area))} sq ft` },
    { label: `Bags of ${view.input.bagSize} cu ft`, value: formatCount(bag.count), note: 'Rounded up to whole bags' },
    { label: 'Coverage', value: `${formatCount(Math.round(view.squareFeetPerYard))} sq ft per yard`, note: `At ${view.input.depthInches} in deep` }
  ])}
</section>
<section class="result-block" aria-labelledby="cost-heading">
  <h2 id="cost-heading">Bags or bulk?</h2>
  ${cost}
</section>`;
}

export function mulchQuickResult(view) {
  return html`<strong>${yards(view.cubicYards)}</strong> · ${formatCount(view.bag.count)} bags of ${view.input.bagSize} cu ft. <a href="#summary-heading">See full results</a>`;
}

export function mulchAnnouncement(view) {
  return `About ${yards(view.cubicYards)} of mulch, or ${formatCount(view.bag.count)} bags of ${view.input.bagSize} cubic feet.`;
}

/**
 * Results panel for the Concrete Calculator. Pure function of the view model
 * from src/adapters/concrete.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const yards = (value) => `${value.toFixed(2)} cu yd`;
const feet = (value) => `${value.toFixed(1)} cu ft`;

function summary(view) {
  return statGrid([
    { label: 'Concrete needed', value: yards(view.cubicYards), primary: true, note: `${feet(view.cubicFeet)}, including ${view.input.wastePercent}% extra` },
    { label: '80 lb bags', value: formatCount(view.bag80.count), note: `About ${formatCount(view.bag80.weightPounds)} lb to move` },
    { label: 'Before waste', value: feet(view.netCubicFeet), note: view.input.quantity > 1 ? `${formatCount(view.input.quantity)} pieces` : 'One piece' }
  ]);
}

function bagTable(view) {
  return dataTable({
    id: 'concrete-bags',
    title: 'Bags needed by size',
    columns: [{ key: 'size', label: 'Bag size' }, { key: 'yield', label: 'Yield per bag', numeric: true }, { key: 'count', label: 'Bags', numeric: true }, { key: 'weight', label: 'Total weight', numeric: true }],
    rows: view.bags.map((bag) => ({
      size: `${bag.pounds} lb`,
      yield: `${bag.yieldCubicFeet} cu ft`,
      count: formatCount(bag.count),
      weight: `${formatCount(bag.weightPounds)} lb`,
      selected: bag.pounds === 80
    }))
  });
}

function costBlock(view) {
  if (!view.comparable) {
    return html`<p class="note">Add a bag price and a ready-mix price per cubic yard to compare the cost of mixing bags with ordering a truck.</p>`;
  }
  const cheaper = view.bag80.cost <= view.readyMixCost ? '80 lb bags' : 'ready-mix';
  return html`<p class="callout">For this job, <strong>${cheaper}</strong> cost less: ${formatCurrency(view.bag80.cost)} for
  ${formatCount(view.bag80.count)} bags vs. ${formatCurrency(view.readyMixCost)} for ready-mix including fees. Labor, mixer rental and
  your time are not included.</p>`;
}

export function concreteResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your concrete estimate</h2>
  ${summary(view)}
  ${bagTable(view)}
</section>
<section class="result-block" aria-labelledby="cost-heading">
  <h2 id="cost-heading">Bags or ready-mix?</h2>
  ${costBlock(view)}
</section>`;
}

export function concreteQuickResult(view) {
  return html`<strong>${yards(view.cubicYards)}</strong> · ${formatCount(view.bag80.count)} bags of 80 lb. <a href="#summary-heading">See full results</a>`;
}

export function concreteAnnouncement(view) {
  return `About ${yards(view.cubicYards)} of concrete, or ${formatCount(view.bag80.count)} 80 pound bags.`;
}

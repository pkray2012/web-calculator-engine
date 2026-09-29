/**
 * Results panel for the Fuel Cost Calculator. Pure function of the view
 * model from src/adapters/fuel-cost.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const num = (value, digits = 1) => value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const miles = (value) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });
const cents = (value) => `${(value * 100).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}¢`;

function tripResults({ input, trip }) {
  const shared = input.people > 1;
  const compare = trip.compare;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Fuel cost of your trip</h2>
  ${statGrid([
    { label: 'Fuel cost', value: formatCurrency(trip.cost), primary: true, note: `${miles(trip.miles)} miles${input.roundTrip ? ' round trip' : ''} at ${formatCurrency(input.pricePerGallon)} a gallon` },
    { label: 'Gas used', value: `${num(trip.gallons)} gal`, note: `At ${miles(input.mpg)} MPG` },
    { label: 'Cost per mile', value: cents(trip.costPerMile), note: `${formatCurrency(trip.costPerMile * 100)} per 100 miles` },
    ...(shared ? [{ label: 'Per person', value: formatCurrency(trip.costPerPerson), note: `Split ${input.people} ways` }] : [])
  ])}
  ${compare ? dataTable({
    id: 'fuel-compare',
    title: 'Same trip in another vehicle',
    columns: [{ key: 'car', label: 'Vehicle' }, { key: 'gallons', label: 'Gallons', numeric: true }, { key: 'cost', label: 'Fuel cost', numeric: true }],
    rows: [
      { car: `${miles(input.mpg)} MPG`, gallons: num(trip.gallons), cost: formatCurrency(trip.cost), selected: true },
      { car: `${miles(compare.mpg)} MPG`, gallons: num(compare.gallons), cost: formatCurrency(compare.cost) }
    ]
  }) : ''}
  ${compare ? html`<p class="note">The ${miles(compare.mpg)} MPG vehicle costs ${formatCurrency(Math.abs(compare.difference))} ${compare.difference >= 0 ? 'more' : 'less'} for this trip.</p>` : ''}
  <p class="note">Fuel only: tolls, parking and wear on the car are not included.</p>
</section>`;
}

function mpgResults({ input, mpgResult }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your fuel economy</h2>
  ${statGrid([
    { label: 'Miles per gallon', value: `${num(mpgResult.mpg)} MPG`, primary: true, note: `${miles(input.milesDriven)} miles on ${num(input.gallonsUsed, 2)} gallons` },
    { label: 'Metric', value: `${num(mpgResult.litersPer100Km)} L/100 km`, note: 'Liters per 100 kilometers' },
    ...(mpgResult.costPerMile !== null ? [
      { label: 'Cost per mile', value: cents(mpgResult.costPerMile), note: `${formatCurrency(mpgResult.costPerMile * 100)} per 100 miles` },
      { label: 'This fill-up', value: formatCurrency(mpgResult.fillCost), note: `At ${formatCurrency(input.pricePerGallon)} a gallon` }
    ] : [])
  ])}
  ${mpgResult.costPerMile === null ? html`<p class="note">Add the gas price to see your cost per mile.</p>` : ''}
</section>`;
}

export function fuelResults(view) {
  return view.trip ? tripResults(view) : mpgResults(view);
}

export function fuelQuickResult(view) {
  if (view.trip) return html`<strong>${formatCurrency(view.trip.cost)}</strong> in fuel for ${miles(view.trip.miles)} miles (${num(view.trip.gallons)} gallons). <a href="#summary-heading">See full results</a>`;
  return html`<strong>${num(view.mpgResult.mpg)} MPG</strong> (${num(view.mpgResult.litersPer100Km)} L/100 km). <a href="#summary-heading">See full results</a>`;
}

export function fuelAnnouncement(view) {
  if (view.trip) return `Fuel cost ${formatCurrency(view.trip.cost)} for ${miles(view.trip.miles)} miles, ${num(view.trip.gallons)} gallons.`;
  return `${num(view.mpgResult.mpg)} miles per gallon.`;
}

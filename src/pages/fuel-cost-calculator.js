/**
 * Fuel Cost Calculator page. Example results, the cost table and every worked
 * figure in the explanatory content are computed from the engine at build
 * time.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { fuelForm } from '../components/fuel-cost-form.js';
import { fuelResults, fuelQuickResult } from '../components/fuel-cost-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { FUEL_DEFAULTS, parseFuelForm, buildFuelView } from '../adapters/fuel-cost.js';
import { calculateTripFuelCost, calculateMpg } from '../calculators/fuel-cost.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

const TABLE_MPG = [15, 20, 25, 30, 35, 40, 50];
const TABLE_PRICES = [3, 3.5, 4, 4.5, 5];

function exampleView(overrides = {}) {
  return buildFuelView(parseFuelForm({ ...FUEL_DEFAULTS, ...overrides }).input);
}

export function fuelCostPage() {
  const calculator = findCalculator('fuel-cost-calculator');
  const example = exampleView();
  const { input, trip } = example;
  const fill = calculateMpg({ milesDriven: Number(FUEL_DEFAULTS.milesDriven), gallonsUsed: Number(FUEL_DEFAULTS.gallonsUsed) });
  const thousand = (mpg) => calculateTripFuelCost({ distanceMiles: 1000, mpg, pricePerGallon: input.pricePerGallon });
  const twenty = thousand(20);
  const thirty = thousand(30);
  const forty = thousand(40);

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out what a drive will cost in gas from the distance, your car's MPG and the price per gallon, split it between passengers
  and compare two vehicles, or find your real MPG from a fill-up. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your trip',
    form: fuelForm(FUEL_DEFAULTS, {}, fuelQuickResult(example)),
    exampleNote: `Example: a ${input.distanceMiles}-mile drive in a car that gets ${input.mpg} MPG, with gas at ${formatCurrency(input.pricePerGallon)} a gallon (an illustrative price, not today's). Enter your trip to update.`,
    results: fuelResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="fuel-how-heading">
    <h2 id="fuel-how-heading">How to calculate the fuel cost of a trip</h2>
    <ol>
      <li><strong>Gallons:</strong> divide the distance by your fuel economy: ${input.distanceMiles} miles ÷ ${input.mpg} MPG = ${trip.gallons.toFixed(2)} gallons.</li>
      <li><strong>Cost:</strong> multiply the gallons by the price per gallon: ${trip.gallons.toFixed(2)} × ${formatCurrency(input.pricePerGallon)} = ${formatCurrency(trip.cost)}.</li>
      <li><strong>Round trip:</strong> double the distance, or tick “Round trip”: ${formatCurrency(trip.cost * 2)}.</li>
    </ol>
    <p class="formula"><code>Fuel cost = miles ÷ MPG × price per gallon</code></p>
    <p>The cost per mile is the price divided by the MPG: ${formatCurrency(input.pricePerGallon)} ÷ ${input.mpg} = ${(trip.costPerMile * 100).toFixed(1)} cents a mile.
    Multiply that by any distance, such as your weekly commute or a year of driving, for a quick estimate.</p>
  </section>

  <section class="content-section" aria-labelledby="fuel-table-heading">
    <h2 id="fuel-table-heading">Fuel cost per 100 miles</h2>
    <p>Find your car's MPG in the first column and the gas price across the top.</p>
    ${dataTable({
      id: 'fuel-table',
      title: 'Cost of gas per 100 miles by MPG and price per gallon',
      columns: [{ key: 'mpg', label: 'MPG' }, ...TABLE_PRICES.map((price) => ({ key: `p${price}`, label: `${formatCurrency(price)}/gal`, numeric: true }))],
      rows: TABLE_MPG.map((mpg) => ({
        mpg: `${mpg} MPG`,
        ...Object.fromEntries(TABLE_PRICES.map((price) => [`p${price}`, formatCurrency(calculateTripFuelCost({ distanceMiles: 100, mpg, pricePerGallon: price }).cost)]))
      }))
    })}
  </section>

  <section class="content-section" aria-labelledby="fuel-compare-heading">
    <h2 id="fuel-compare-heading">Comparing vehicles</h2>
    <p>Fuel savings shrink as MPG rises. Over 1,000 miles at ${formatCurrency(input.pricePerGallon)} a gallon, going from 20 to 30 MPG saves
    ${formatCurrency(twenty.cost - thirty.cost)} (${formatCurrency(twenty.cost)} → ${formatCurrency(thirty.cost)}), but going from 30 to 40 MPG saves only
    ${formatCurrency(thirty.cost - forty.cost)}. That is because cost follows gallons per mile, not miles per gallon. Enter a second MPG in “Compare with” to see
    the difference for your own trip.</p>
  </section>

  <section class="content-section" aria-labelledby="fuel-mpg-heading">
    <h2 id="fuel-mpg-heading">How to work out your real MPG</h2>
    <ol>
      <li>Fill the tank and reset the trip meter.</li>
      <li>Drive as usual until you need gas, then fill the tank again.</li>
      <li>Divide the miles on the trip meter by the gallons it took to refill: ${FUEL_DEFAULTS.milesDriven} ÷ ${FUEL_DEFAULTS.gallonsUsed} = ${fill.mpg.toFixed(1)} MPG,
      or ${fill.litersPer100Km.toFixed(1)} liters per 100 km.</li>
    </ol>
    <p>Your MPG can differ from the EPA rating on the window sticker. How and where you drive, maintenance, weather, air conditioning, load and fuel
    all affect it; the ratings are best used to compare vehicles (<a href="${SOURCES.fuelEconomyVaries.url}">FuelEconomy.gov: your mileage will vary</a>).
    Averaging a few fill-ups gives a steadier figure for trip estimates.</p>
  </section>

  <section class="content-section" aria-labelledby="fuel-assumptions-heading">
    <h2 id="fuel-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Fuel only. Tolls, parking, maintenance, tires and depreciation are not included.</li>
      <li>One MPG and one gas price for the whole trip. Highway and city driving, traffic, hills and price changes along the route will move the result.</li>
      <li>Gasoline or diesel priced per gallon. Electric vehicles, which use kilowatt-hours, are not covered.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="fuel-method-heading">
    <h2 id="fuel-method-heading">Methodology and testing</h2>
    <p>Gallons = miles ÷ MPG; cost = gallons × price; MPG = miles ÷ gallons. Liters per 100 km use the exact US gallon (3.785411784 liters) and mile
    (1.609344 km). Automated tests check hand-worked examples, round trips, cost splitting, vehicle comparisons and the metric conversion.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.fuelEconomyVaries])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/fuel-cost.js']
  };
}

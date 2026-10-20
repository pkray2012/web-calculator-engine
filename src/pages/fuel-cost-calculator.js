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
import { faqSection, faqStructuredData, directAnswer } from '../components/faq.js';

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

  // Direct answer and worked examples. Every figure comes from the engine.
  const quick = calculateTripFuelCost({ distanceMiles: 300, mpg: 25, pricePerGallon: 3.5 });
  const twoCars = calculateTripFuelCost({ distanceMiles: 720, mpg: 24, pricePerGallon: 4.09, compareMpg: 36 });
  const twoCarsGap = -twoCars.compare.difference;
  const roundTrip = calculateTripFuelCost({ distanceMiles: 150, mpg: 30, pricePerGallon: 3.5, roundTrip: true, people: 3 });
  const commute = calculateTripFuelCost({ distanceMiles: 20, mpg: 28, pricePerGallon: 3.5, roundTrip: true });
  const workdays = 250;
  const faqs = [
    {
      question: 'How do I calculate the gas cost of a trip?',
      answer: `Divide the distance by your car's MPG to get gallons, then multiply by the price per gallon. For example, 300 miles at 25 MPG uses ${quick.gallons.toFixed(0)} gallons, and at $3.50 a gallon that costs ${formatCurrency(quick.cost)}.`
    },
    {
      question: 'How do I calculate my car\'s MPG?',
      answer: `Fill the tank, reset the trip meter, drive until you need gas, then divide the miles driven by the gallons it takes to refill. For example, ${FUEL_DEFAULTS.milesDriven} miles on ${FUEL_DEFAULTS.gallonsUsed} gallons is ${fill.mpg.toFixed(1)} MPG.`
    },
    {
      question: 'How do I work out the fuel cost per mile?',
      answer: `Divide the price per gallon by the MPG. At $3.50 a gallon and 25 MPG, gas costs ${(quick.costPerMile * 100).toFixed(0)} cents a mile.`
    },
    {
      question: 'How much does a round trip cost in gas?',
      answer: `Double the one-way distance before you divide by MPG. A 150-mile drive each way at 30 MPG and $3.50 a gallon is ${roundTrip.miles} miles, ${roundTrip.gallons.toFixed(0)} gallons and ${formatCurrency(roundTrip.cost)}, or ${formatCurrency(roundTrip.costPerPerson)} each for three people.`
    },
    {
      question: 'How much more does a less efficient car spend on gas?',
      answer: `Work out the cost for each car over the same distance and subtract. Over 720 miles with gas at $4.09, a 24 MPG car spends ${formatCurrency(twoCars.cost)} and a 36 MPG car ${formatCurrency(twoCars.compare.cost)}, so the 24 MPG car spends ${formatCurrency(twoCarsGap)} more.`
    },
    {
      question: 'Does the calculator include tolls, parking or electric cars?',
      answer: 'No. It covers gasoline or diesel priced per gallon. Tolls, parking, wear and depreciation are not included, and electric vehicles, which use kilowatt-hours, are not covered.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Fuel cost = miles ÷ MPG × price per gallon.</strong> For example, 300 miles at 25 MPG with gas at $3.50 a gallon uses
  ${quick.gallons.toFixed(0)} gallons and costs ${formatCurrency(quick.cost)}.`)}
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

  <section class="content-section" aria-labelledby="fuel-examples-heading">
    <h2 id="fuel-examples-heading">Worked examples</h2>
    <h3>Two cars, same distance</h3>
    <p>Two students each drive 720 miles. Car A gets 24 MPG and car B gets 36 MPG, and gas is $4.09 a gallon. Car A uses
    720 ÷ 24 = ${twoCars.gallons.toFixed(0)} gallons, costing ${formatCurrency(twoCars.cost)}; car B uses 720 ÷ 36 = ${twoCars.compare.gallons.toFixed(0)} gallons, costing
    ${formatCurrency(twoCars.compare.cost)}. Car A spends <strong>${formatCurrency(twoCarsGap)} more</strong> on gas.</p>
    <h3>A round trip split three ways</h3>
    <p>A 150-mile drive each way is ${roundTrip.miles} miles in total. At 30 MPG that is ${roundTrip.gallons.toFixed(0)} gallons, and at $3.50 a gallon
    ${formatCurrency(roundTrip.cost)}, or ${formatCurrency(roundTrip.costPerPerson)} each for three people.</p>
    <h3>A year of commuting</h3>
    <p>A 20-mile commute each way is ${commute.miles} miles a day. At 28 MPG and $3.50 a gallon that is ${formatCurrency(commute.cost)} a day, or about
    ${formatCurrency(commute.cost * workdays)} over ${workdays} working days.</p>
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

  ${faqSection(faqs, 'fuel-faq')}

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
    structuredData: [faqStructuredData(faqs)],
    scripts: ['client/fuel-cost.js']
  };
}

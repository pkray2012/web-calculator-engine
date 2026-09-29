/**
 * BTU Calculator page. Example results, the sizing table and every worked
 * figure in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { btuForm } from '../components/btu-form.js';
import { btuResults, btuQuickResult, btuText } from '../components/btu-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { BTU_DEFAULTS, parseBtuForm, buildBtuView } from '../adapters/btu.js';
import { roomAcSize, SIZING_CHART } from '../calculators/btu.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildBtuView(parseBtuForm({ ...BTU_DEFAULTS, ...overrides }).input);
}

export function btuPage() {
  const calculator = findCalculator('btu-calculator');
  const example = exampleView();
  const { input } = example;
  const plain = roomAcSize({ squareFeet: input.squareFeet });
  const shaded = roomAcSize({ squareFeet: 500, sun: 'shaded' });
  const kitchen = roomAcSize({ squareFeet: 200, kitchen: true });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Find the right size window or room air conditioner, in BTU per hour, for a room of 100 to 1,000 square feet. The calculator uses
  the ENERGY STAR sizing chart and adjusts for sun, shade, the number of people and kitchens. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your room',
    form: btuForm(BTU_DEFAULTS, {}, btuQuickResult(example)),
    exampleNote: `Example: a ${input.lengthFeet} × ${input.widthFeet} ft room that is very sunny and used by ${input.people} people. Enter your room to update.`,
    results: btuResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="btu-how-heading">
    <h2 id="btu-how-heading">How to size a room air conditioner</h2>
    <ol>
      <li>Measure the room and multiply length by width for its area in square feet. The example is ${input.lengthFeet} × ${input.widthFeet} =
      ${formatCount(input.squareFeet)} square feet.</li>
      <li>Find the capacity for that area in the chart below: ${btuText(plain.btu)} per hour for the example.</li>
      <li>Adjust for the room (<a href="${SOURCES.energyStarRoomAc.url}">ENERGY STAR: choosing the right size</a>): 10% less if it is heavily shaded,
      10% more if it is very sunny, 600 BTU for each person beyond two who regularly uses it, and 4,000 BTU if it is a kitchen.</li>
    </ol>
    <p>The example is very sunny (+${btuText(example.sunBtu)}) and used by ${input.people} people (+${btuText(example.peopleBtu)}), so it needs about
    ${btuText(example.btu)} per hour. A shaded 500 sq ft room needs ${btuText(shaded.btu)}, and a 200 sq ft kitchen ${btuText(kitchen.btu)}.</p>
  </section>

  <section class="content-section" aria-labelledby="btu-chart-heading">
    <h2 id="btu-chart-heading">Air conditioner size by room area</h2>
    ${dataTable({
      id: 'btu-chart',
      title: 'Cooling capacity for an average room, before adjustments',
      columns: [{ key: 'area', label: 'Area to be cooled' }, { key: 'btu', label: 'Capacity needed', numeric: true }],
      rows: SIZING_CHART.map((row) => ({ area: `${formatCount(row.fromSquareFeet)} to ${formatCount(row.toSquareFeet)} sq ft`, btu: `${btuText(row.btu)} per hour` }))
    })}
    <p>Air conditioners come in set sizes. If your result falls between two models, the closer one is usually the better choice; the adjustments above
    matter more than a few hundred BTU either way.</p>
  </section>

  <section class="content-section" aria-labelledby="btu-why-heading">
    <h2 id="btu-why-heading">Why the right size matters</h2>
    <p>Bigger is not better. A unit that is much too large cools the air quickly and shuts off before it has removed much humidity, so the room can feel
    cold and clammy, and it costs more to buy. One that is too small runs almost constantly and may not keep up on the hottest days.</p>
  </section>

  <section class="content-section" aria-labelledby="btu-units-heading">
    <h2 id="btu-units-heading">BTU, tons and watts</h2>
    <ul>
      <li>A BTU (British thermal unit) is a unit of heat. Air conditioner capacity is the heat it removes per hour, in BTU per hour, often written just “BTU”.</li>
      <li>A “ton” of cooling is 12,000 BTU per hour, the unit used for central air conditioners and heat pumps. The example is ${example.tons.toFixed(2)} tons.</li>
      <li>1 BTU per hour is about 0.293 watts of cooling, so ${btuText(example.btu)} per hour is about ${formatCount(Math.round(example.watts))} watts. That is
      cooling output, not the electricity the unit uses, which is much less.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="btu-assumptions-heading">
    <h2 id="btu-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>The chart assumes a room with ordinary ceilings (about 8 feet), insulation and windows. High ceilings, large or west-facing windows, poor
      insulation or an attic room above can need more capacity.</li>
      <li>It covers single rooms of 100 to 1,000 square feet. Central air conditioning for a whole house should be sized with a room-by-room load
      calculation (ACCA Manual J) by a heating and cooling contractor.</li>
      <li>Portable air conditioners are rated under a different test and often list a lower capacity for the same unit; compare like with like.</li>
      <li>Heating is not included.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="btu-method-heading">
    <h2 id="btu-method-heading">Methodology and testing</h2>
    <p>Capacity = chart capacity for the area × (1 − 10% if heavily shaded, or + 10% if very sunny) + 600 BTU per person beyond two + 4,000 BTU for a
    kitchen. Automated tests check every chart row and boundary, each adjustment on its own and together, and that areas outside the chart are
    rejected. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.energyStarRoomAc])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/btu.js']
  };
}

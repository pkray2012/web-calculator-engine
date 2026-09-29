/**
 * Flooring Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { flooringForm } from '../components/flooring-form.js';
import { flooringResults, flooringQuickResult } from '../components/flooring-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { FLOORING_DEFAULTS, parseFlooringForm, buildFlooringView } from '../adapters/flooring.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildFlooringView(parseFlooringForm({ ...FLOORING_DEFAULTS, ...overrides }).input);
}

export function flooringPage() {
  const calculator = findCalculator('flooring-calculator');
  const example = exampleView();
  const { input } = example;
  const herringbone = exampleView({ wastePercent: '20' });
  const tight = exampleView({ wastePercent: '5' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how many boxes of flooring you need for one or more rooms, with an allowance for cuts and waste, what you will have left
  over, and what it costs. Works for laminate, vinyl plank, engineered wood and tile sold by the box. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your rooms and flooring',
    form: flooringForm(FLOORING_DEFAULTS, {}, flooringQuickResult(example)),
    exampleNote: `Example: a ${input.rooms[0].lengthFeet} × ${input.rooms[0].widthFeet} ft room and a ${input.rooms[1].lengthFeet} × ${input.rooms[1].widthFeet} ft room, ${input.wastePercent}% extra, in boxes covering ${input.boxCoverage} sq ft. Enter your numbers to update.`,
    results: flooringResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="floor-how-heading">
    <h2 id="floor-how-heading">How to calculate flooring</h2>
    <ol>
      <li>Measure each room's length and width in feet and multiply. The example's rooms are ${formatCount(example.roomAreas[0])} and ${formatCount(example.roomAreas[1])} square
      feet, ${formatCount(example.area)} in total. If you measure in inches, divide square inches by 144 to get square feet
      (<a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>).</li>
      <li>Add extra for cuts and mistakes: ${input.wastePercent}% takes it to ${formatCount(example.areaWithWaste)} square feet.</li>
      <li>Divide by the coverage on the carton and round up: ${formatCount(example.areaWithWaste)} ÷ ${input.boxCoverage} → ${formatCount(example.boxes)} boxes,
      covering ${example.purchased.toFixed(1)} square feet.</li>
    </ol>
  </section>

  <section class="content-section" aria-labelledby="waste-heading">
    <h2 id="waste-heading">How much extra to allow</h2>
    <p>Cuts at walls, doorways and closets waste some boards or tiles. Around 5% is typical for a simple rectangular room, 10% for a home with several
    rooms and closets, and 15% to 20% for diagonal, herringbone or chevron patterns. For the example, 5% means ${formatCount(tight.boxes)} boxes and 20% means
    ${formatCount(herringbone.boxes)}. The installer's guidance for your product takes precedence.</p>
  </section>

  <section class="content-section" aria-labelledby="floor-assumptions-heading">
    <h2 id="floor-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Underlayment, transitions, trim and adhesive, which are usually sold separately.</li>
      <li>Non-rectangular rooms. Split them into rectangles and use the extra room rows.</li>
      <li>Installation labor.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="floor-method-heading">
    <h2 id="floor-method-heading">Methodology and testing</h2>
    <p>Automated tests compare areas, box counts, leftovers and costs with an independent calculation, and check that an area that is an exact multiple
    of a box's coverage is not rounded up an extra box. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.nistUnits])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/flooring.js']
  };
}

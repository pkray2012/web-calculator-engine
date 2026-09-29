/**
 * Mulch Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { mulchForm } from '../components/mulch-form.js';
import { mulchResults, mulchQuickResult } from '../components/mulch-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { MULCH_DEFAULTS, parseMulchForm, buildMulchView } from '../adapters/mulch.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildMulchView(parseMulchForm({ ...MULCH_DEFAULTS, ...overrides }).input);
}

export function mulchPage() {
  const calculator = findCalculator('mulch-calculator');
  const example = exampleView();
  const { input } = example;
  const twoInch = exampleView({ depthInches: '2' });
  const threeCuFt = exampleView({ bagSize: '3' });
  const ring = exampleView({ shape: 'round', quantity: '1' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how much mulch your beds and tree rings need, in cubic yards and in bags, and compare buying bags with bulk delivery.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your beds and mulch',
    form: mulchForm(MULCH_DEFAULTS, {}, mulchQuickResult(example)),
    exampleNote: `Example: ${input.quantity} beds of ${input.lengthFeet} × ${input.widthFeet} ft, ${input.depthInches} inches deep, in ${input.bagSize} cubic foot bags. Enter your numbers to update.`,
    results: mulchResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="mulch-how-heading">
    <h2 id="mulch-how-heading">How to calculate mulch</h2>
    <ol>
      <li>Area: length × width, or π × (diameter ÷ 2)² for a round bed. A tree ring ${ring.input.diameterFeet} feet across is ${ring.area.toFixed(1)} square feet.</li>
      <li>Volume: area × depth in feet (inches ÷ 12). The example's ${formatCount(example.area)} square feet at ${input.depthInches} inches is
      ${example.cubicFeet.toFixed(1)} cubic feet.</li>
      <li>Cubic yards = cubic feet ÷ 27 (<a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>): ${example.cubicYards.toFixed(2)} cubic yards.</li>
      <li>Bags = cubic feet ÷ bag size, rounded up: ${formatCount(example.bag.count)} bags of ${input.bagSize} cubic feet, or ${formatCount(threeCuFt.bag.count)} of 3.</li>
    </ol>
  </section>

  <section class="content-section" aria-labelledby="mulch-depth-heading">
    <h2 id="mulch-depth-heading">Depth and coverage</h2>
    <p>One cubic yard covers ${formatCount(example.squareFeetPerYard)} square feet at ${input.depthInches} inches and ${formatCount(twoInch.squareFeetPerYard)} at 2 inches.
    Topping up an existing layer usually needs less than a new bed. Keep mulch pulled back from tree trunks and plant stems.</p>
  </section>

  <section class="content-section" aria-labelledby="mulch-assumptions-heading">
    <h2 id="mulch-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Settling: fresh mulch compacts over time, so some people add a little extra.</li>
      <li>Irregular beds. Split them into rectangles and circles and add the results.</li>
      <li>Delivery minimums, which vary by supplier.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="mulch-method-heading">
    <h2 id="mulch-method-heading">Methodology and testing</h2>
    <p>Automated tests compare areas, volumes, bag counts, coverage and costs with an independent calculation, and check that an exact multiple of a
    bag size is not rounded up an extra bag. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/mulch.js']
  };
}

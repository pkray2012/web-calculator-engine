/**
 * Roofing Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { roofingForm } from '../components/roofing-form.js';
import { roofingResults, roofingQuickResult } from '../components/roofing-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { dataTable } from '../components/results.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { ROOFING_DEFAULTS, parseRoofingForm, buildRoofingView } from '../adapters/roofing.js';
import { pitchFactor } from '../calculators/roofing.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildRoofingView(parseRoofingForm({ ...ROOFING_DEFAULTS, ...overrides }).input);
}

export function roofingPage() {
  const calculator = findCalculator('roofing-calculator');
  const example = exampleView();
  const { input } = example;
  const steep = exampleView({ pitchRise: '12' });
  const heavy = exampleView({ bundlesPerSquare: '4' });
  const pitches = [3, 4, 6, 8, 10, 12];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out your roof's area from the size of the house and the roof pitch, how many roofing squares that is, and how many bundles
  of shingles to buy with an allowance for waste. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your roof and shingles',
    form: roofingForm(ROOFING_DEFAULTS, {}, roofingQuickResult(example)),
    exampleNote: `Example: a ${input.lengthFeet} × ${input.widthFeet} ft footprint including overhangs, a ${input.pitchRise}/12 pitch, ${input.wastePercent}% extra and ${input.bundlesPerSquare} bundles per square. Enter your numbers to update.`,
    results: roofingResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="roof-how-heading">
    <h2 id="roof-how-heading">How to calculate roofing</h2>
    <ol>
      <li><strong>Footprint:</strong> measure the house on the ground, adding the overhang on every side: ${input.lengthFeet} × ${input.widthFeet} =
      ${formatCount(example.footprint)} square feet. If you measure in inches, divide square inches by 144 for square feet
      (<a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>).</li>
      <li><strong>Pitch:</strong> a sloped roof has more area than its footprint. Multiply by the pitch factor, √(1 + (rise ÷ 12)²). For ${input.pitchRise}/12
      that is ${example.pitchFactor.toFixed(4)}, so the roof is ${formatCount(example.roofArea)} square feet.</li>
      <li><strong>Squares:</strong> roofers count in squares of 100 square feet: ${example.squares.toFixed(2)} squares, or ${example.squaresWithWaste.toFixed(2)}
      with ${input.wastePercent}% extra.</li>
      <li><strong>Bundles:</strong> multiply by the bundles per square on the wrapper and round up: ${formatCount(example.bundles)} bundles.</li>
    </ol>
    <p>The same pitch factor works for a hip roof as for a gable roof, as long as every face has the same pitch: each face's area is its footprint
    divided by the cosine of the slope. For roofs with different pitches, work out each section separately.</p>
  </section>

  <section class="content-section" aria-labelledby="roof-pitch-heading">
    <h2 id="roof-pitch-heading">Pitch factors</h2>
    <p>At a 12/12 pitch, the example roof needs ${formatCount(steep.bundles)} bundles instead of ${formatCount(example.bundles)}.</p>
    ${dataTable({
      id: 'roof-pitch-factors',
      title: 'Roof area per square foot of footprint',
      columns: [{ key: 'pitch', label: 'Pitch' }, { key: 'factor', label: 'Pitch factor', numeric: true }],
      rows: pitches.map((rise) => ({ pitch: `${rise}/12`, factor: pitchFactor(rise).toFixed(3), selected: rise === input.pitchRise }))
    })}
  </section>

  <section class="content-section" aria-labelledby="roof-bundles-heading">
    <h2 id="roof-bundles-heading">Bundles per square and waste</h2>
    <p>Most three-tab and architectural shingles come three bundles to a square; some heavier shingles are four, which for the example means
    ${formatCount(heavy.bundles)} bundles. Allow about 10% extra for a simple gable roof, around 15% for hips, valleys or dormers, and more for complex
    roofs. The manufacturer's coverage on the wrapper takes precedence.</p>
  </section>

  <section class="content-section" aria-labelledby="roof-assumptions-heading">
    <h2 id="roof-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Ridge caps, starter strip, underlayment, drip edge, flashing, ventilation and nails.</li>
      <li>Tearing off the old roof, disposal and labor.</li>
      <li>Roofs whose faces have different pitches. Work out each section separately and add them.</li>
    </ul>
    <p>Results are estimates for planning a purchase. A roofer's measurement of your roof may differ.</p>
  </section>

  <section class="content-section" aria-labelledby="roof-method-heading">
    <h2 id="roof-method-heading">Methodology and testing</h2>
    <p>Automated tests compare roof area, squares and bundles with an independent calculation, including a check that the pitch factor gives the
    same area as the face-by-face geometry of a hip roof. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/roofing.js']
  };
}

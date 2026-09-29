/**
 * Asphalt Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { asphaltForm } from '../components/asphalt-form.js';
import { asphaltResults, asphaltQuickResult, num } from '../components/asphalt-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { ASPHALT_DEFAULTS, parseAsphaltForm, buildAsphaltView } from '../adapters/asphalt.js';
import { calculateAsphalt } from '../calculators/asphalt.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildAsphaltView(parseAsphaltForm({ ...ASPHALT_DEFAULTS, ...overrides }).input);
}

export function asphaltPage() {
  const calculator = findCalculator('asphalt-calculator');
  const example = exampleView();
  const { input } = example;
  const lot = calculateAsphalt({ lengthFeet: 100, widthFeet: 60, thicknessInches: 4, wastePercent: 5, pricePerTon: 110 });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Estimate how many tons of asphalt a driveway, path or parking area needs from its length, width and thickness, with extra for
  waste and an optional cost at your price per ton. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your paving job',
    form: asphaltForm(ASPHALT_DEFAULTS, {}, asphaltQuickResult(example)),
    exampleNote: `Example: a ${input.lengthFeet} × ${input.widthFeet} ft driveway, ${input.thicknessInches} inches thick, at ${input.densityLbPerCuFt} lb per cubic foot with ${input.wastePercent}% extra. Enter your measurements to update.`,
    results: asphaltResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="asphalt-how-heading">
    <h2 id="asphalt-how-heading">How to calculate asphalt tonnage</h2>
    <ol>
      <li><strong>Area:</strong> length × width: ${num(input.lengthFeet)} × ${num(input.widthFeet)} = ${num(example.areaSquareFeet)} sq ft.</li>
      <li><strong>Volume:</strong> area × thickness in feet (inches ÷ 12): ${num(example.areaSquareFeet)} × ${num(input.thicknessInches)} ÷ 12 = ${num(example.cubicFeet)} cu ft,
      or ${num(example.cubicYards)} cubic yards (27 cubic feet to a cubic yard).</li>
      <li><strong>Weight:</strong> volume × density: ${num(example.cubicFeet)} × ${num(input.densityLbPerCuFt)} = ${num(example.pounds, 0)} lb.</li>
      <li><strong>Tons:</strong> pounds ÷ 2,000 (a US short ton): ${num(example.tons)} tons, or ${num(example.tonsToOrder)} with ${num(input.wastePercent, 1)}% extra.</li>
    </ol>
    <p class="formula"><code>Tons = length × width × (thickness ÷ 12) × density ÷ 2,000</code></p>
    <p>Units follow the <a href="${SOURCES.nistUnits.url}">NIST tables of units of measurement</a>.</p>
  </section>

  <section class="content-section" aria-labelledby="asphalt-example-heading">
    <h2 id="asphalt-example-heading">A larger example</h2>
    <p>A 100 × 60 ft parking area paved 4 inches thick needs ${num(lot.cubicYards)} cubic yards, about ${num(lot.tons)} tons at 145 lb per cubic foot, or
    ${num(lot.tonsToOrder)} tons with 5% extra. At ${formatCurrency(110)} a ton for the material, that is about ${formatCurrency(lot.cost)}; delivery, base
    preparation and paving labor are priced separately.</p>
  </section>

  <section class="content-section" aria-labelledby="asphalt-assumptions-heading">
    <h2 id="asphalt-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>The density default of 145 lb per cubic foot is a planning figure for compacted hot-mix asphalt. Mixes differ; use your supplier's figure
      when you have it.</li>
      <li>The thickness is the finished, compacted thickness. The gravel base underneath and any tack coat are not included.</li>
      <li>The area is a rectangle. For other shapes, work out the square footage separately and enter it as a length with a width of 1 foot.</li>
    </ul>
    <p>Results are estimates for planning a purchase; your paving contractor will set the final quantity.</p>
  </section>

  <section class="content-section" aria-labelledby="asphalt-method-heading">
    <h2 id="asphalt-method-heading">Methodology and testing</h2>
    <p>Automated tests check the hand-worked example, that tons scale in proportion to thickness and density, the waste allowance and cost, and the
    cubic-yard conversion. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/asphalt.js']
  };
}

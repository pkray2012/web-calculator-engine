/**
 * Gravel Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { gravelForm } from '../components/gravel-form.js';
import { gravelResults, gravelQuickResult } from '../components/gravel-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { GRAVEL_DEFAULTS, parseGravelForm, buildGravelView } from '../adapters/gravel.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildGravelView(parseGravelForm({ ...GRAVEL_DEFAULTS, ...overrides }).input);
}

export function gravelPage() {
  const calculator = findCalculator('gravel-calculator');
  const example = exampleView();
  const { input } = example;
  const heavier = exampleView({ tonsPerYard: '1.7' });
  const deeper = exampleView({ depthInches: '4' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how much gravel a driveway, path, patio base or bed needs, in cubic yards and in tons, with an allowance for compaction.
  Add a price per ton or per yard to estimate the cost. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your area and material',
    form: gravelForm(GRAVEL_DEFAULTS, {}, gravelQuickResult(example)),
    exampleNote: `Example: a ${input.lengthFeet} × ${input.widthFeet} ft area, ${input.depthInches} inches deep, with ${input.extraPercent}% extra, at ${input.tonsPerYard} tons per cubic yard (a typical figure; ask your supplier). Enter your numbers to update.`,
    results: gravelResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="gravel-how-heading">
    <h2 id="gravel-how-heading">How to calculate gravel</h2>
    <ol>
      <li>Area: length × width, or π × (diameter ÷ 2)² for a circle. The example is ${formatCount(example.area)} square feet.</li>
      <li>Volume: area × depth in feet (inches ÷ 12), then ÷ 27 for cubic yards, since a cubic yard is 27 cubic feet
      (<a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>). With ${input.extraPercent}% extra, the example is ${example.cubicYards.toFixed(2)} cubic yards.</li>
      <li>Weight: cubic yards × tons per cubic yard. A US ton is 2,000 pounds. The example is ${example.tons.toFixed(2)} tons.</li>
    </ol>
  </section>

  <section class="content-section" aria-labelledby="density-heading">
    <h2 id="density-heading">Why tons per yard matters</h2>
    <p>Suppliers often sell gravel by the ton, but you measure the area in feet, so the stone's density links the two. The same example at
    ${heavier.input.tonsPerYard} tons per cubic yard is ${heavier.tons.toFixed(2)} tons instead of ${example.tons.toFixed(2)}. Crushed stone, pea gravel and
    base materials differ, and wet stone weighs more, so use the figure your supplier gives you.</p>
  </section>

  <section class="content-section" aria-labelledby="depth-heading">
    <h2 id="depth-heading">Depth and compaction</h2>
    <p>Depth drives the total: at ${deeper.input.depthInches} inches instead of ${input.depthInches}, the example needs ${deeper.tons.toFixed(2)} tons. Base layers
    that are compacted settle, so order some extra; the right depth for a driveway or patio base depends on the soil and the load.</p>
  </section>

  <section class="content-section" aria-labelledby="gravel-assumptions-heading">
    <h2 id="gravel-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Landscape fabric, edging, excavation and labor.</li>
      <li>Irregular shapes. Split them into rectangles and circles and add the results.</li>
      <li>Delivery minimums or truck sizes, which vary by supplier.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="gravel-method-heading">
    <h2 id="gravel-method-heading">Methodology and testing</h2>
    <p>Automated tests compare areas, volumes, tons, coverage and costs with an independent calculation, including a 9 × 9 ft area 4 inches deep that
    is exactly one cubic yard. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/gravel.js']
  };
}

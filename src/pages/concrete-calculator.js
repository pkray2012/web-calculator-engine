/**
 * Concrete Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { concreteForm } from '../components/concrete-form.js';
import { concreteResults, concreteQuickResult } from '../components/concrete-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { CONCRETE_DEFAULTS, parseConcreteForm, buildConcreteView } from '../adapters/concrete.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildConcreteView(parseConcreteForm({ ...CONCRETE_DEFAULTS, ...overrides }).input);
}

export function concretePage() {
  const calculator = findCalculator('concrete-calculator');
  const example = exampleView();
  const { input } = example;
  const sixInch = exampleView({ depthInches: '6' });
  const posts = exampleView({ shape: 'round', quantity: '6', wastePercent: '5' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how much concrete a slab, patio, footing or set of post holes needs, in cubic yards and in 40, 60 or 80 lb bags, with an
  allowance for waste. Add prices to compare mixing bags with ordering ready-mix. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your pour',
    form: concreteForm(CONCRETE_DEFAULTS, {}, concreteQuickResult(example)),
    exampleNote: `Example: a ${input.lengthFeet} × ${input.widthFeet} ft slab, ${input.depthInches} inches thick, with ${input.wastePercent}% extra. Bag yields are typical figures; check your bag. Enter your numbers to update.`,
    results: concreteResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="volume-heading">
    <h2 id="volume-heading">How to calculate concrete volume</h2>
    <ol>
      <li>Rectangular pour: length × width × thickness, with the thickness in feet (inches ÷ 12). The example is ${input.lengthFeet} × ${input.widthFeet} ×
      ${input.depthInches} ÷ 12 = ${example.netCubicFeet.toFixed(1)} cubic feet.</li>
      <li>Round hole or column: π × radius² × depth. Six 10-inch holes 4 feet deep hold ${posts.netCubicFeet.toFixed(1)} cubic feet.</li>
      <li>Cubic yards = cubic feet ÷ 27, since a cubic yard is 3 × 3 × 3 feet (<a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>).</li>
      <li>Add extra for spillage, over-digging and uneven ground: the example's ${input.wastePercent}% takes it to ${example.cubicYards.toFixed(2)} cubic yards.</li>
    </ol>
  </section>

  <section class="content-section" aria-labelledby="bags-heading">
    <h2 id="bags-heading">How many bags</h2>
    <p>Divide the volume by what one bag makes and round up. Yields depend on the product; common figures are about 0.30, 0.45 and 0.60 cubic feet
    for 40, 60 and 80 lb bags, which is what the form starts with. The example needs ${formatCount(example.bag80.count)} bags of 80 lb, about
    ${formatCount(example.bag80.weightPounds)} lb to carry and mix. At 6 inches thick instead of ${input.depthInches}, it needs ${sixInch.cubicYards.toFixed(2)}
    cubic yards, or ${formatCount(sixInch.bag80.count)} bags.</p>
  </section>

  <section class="content-section" aria-labelledby="readymix-heading">
    <h2 id="readymix-heading">Bags or a ready-mix truck?</h2>
    <p>Bags suit small jobs you can mix by hand or with a rented mixer. For larger pours, ready-mix delivered by truck is easier and gives a
    consistent pour, but suppliers often charge a delivery or short-load fee for small orders. Enter your local prices to compare the two for your job.</p>
  </section>

  <section class="content-section" aria-labelledby="concrete-assumptions-heading">
    <h2 id="concrete-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Gravel base, forms, rebar or mesh, and labor.</li>
      <li>Steps, curbs and irregular shapes. Split them into rectangles and add the results.</li>
      <li>Engineering: thickness and reinforcement for driveways or structural footings depend on your soil, loads and local building code.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="concrete-method-heading">
    <h2 id="concrete-method-heading">Methodology and testing</h2>
    <p>Automated tests compare the volumes, bag counts and costs with an independent calculation, and check that a volume that is an exact
    multiple of a bag's yield is not rounded up an extra bag. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/concrete.js']
  };
}

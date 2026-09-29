/**
 * Square Footage Calculator page. Example results, the conversion table and
 * every worked figure in the explanatory content are computed from the engine
 * at build time.
 */

import { html } from '../lib/html.js';
import { squareFootageForm } from '../components/square-footage-form.js';
import { squareFootageResults, squareFootageQuickResult, num } from '../components/square-footage-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { SQFT_DEFAULTS, parseSquareFootageForm, buildSquareFootageView } from '../adapters/square-footage.js';
import { calculateSquareFootage } from '../calculators/square-footage.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

const TABLE_SQFT = [100, 250, 500, 1000, 1500, 2000, 2500, 5000, 10_000, 43_560];

function exampleView(overrides = {}) {
  return buildSquareFootageView(parseSquareFootageForm({ ...SQFT_DEFAULTS, ...overrides }).input);
}

export function squareFootagePage() {
  const calculator = findCalculator('square-footage-calculator');
  const example = exampleView();
  /** @param {string} shape @param {Record<string, number>} dims @param {'ft' | 'in' | 'yd' | 'm' | 'cm'} [unit] */
  const sq = (shape, dims, unit = 'ft') => calculateSquareFootage({ shape, dims, unit });
  const main = sq('rect', { length: 12, width: 14 });
  const nook = sq('rect', { length: 6, width: 8 });
  const circle = sq('circle', { diameter: 10 });
  const tri = sq('tri', { base: 8, height: 6 });
  const trap = sq('trap', { sideA: 10, sideB: 14, height: 8 });
  const inches = sq('rect', { length: 144, width: 168 }, 'in');
  const metric = sq('rect', { length: 4, width: 5 }, 'm');

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Find the square footage of a rectangle, circle, triangle or trapezoid from measurements in feet, inches, yards, meters or
  centimeters, see it in square yards, square meters and acres, and price it by the square foot. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your measurements',
    form: squareFootageForm(SQFT_DEFAULTS, {}, squareFootageQuickResult(example)),
    exampleNote: 'Example: a 12 × 14 ft room. Choose a shape and enter your measurements to update.',
    results: squareFootageResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="sqft-how-heading">
    <h2 id="sqft-how-heading">How to calculate square footage</h2>
    <p>For a rectangle or square, multiply the length by the width in feet: 12 ft × 14 ft = ${num(main.squareFeet)} sq ft.</p>
    <p class="formula"><code>Square feet = length (ft) × width (ft)</code></p>
    <p><strong>Irregular rooms:</strong> split the floor into rectangles, work out each one and add them. An L-shaped room made of a 12 × 14 ft area and a
    6 × 8 ft nook is ${num(main.squareFeet)} + ${num(nook.squareFeet)} = ${num(main.squareFeet + nook.squareFeet)} sq ft. To leave out something like a
    kitchen island, subtract its area instead.</p>
  </section>

  <section class="content-section" aria-labelledby="sqft-shapes-heading">
    <h2 id="sqft-shapes-heading">Other shapes</h2>
    <ul>
      <li><strong>Circle:</strong> π × (diameter ÷ 2)². A 10 ft circle is ${num(circle.squareFeet)} sq ft.</li>
      <li><strong>Triangle:</strong> base × height ÷ 2. A triangle 8 ft across and 6 ft high is ${num(tri.squareFeet)} sq ft.</li>
      <li><strong>Trapezoid</strong> (two parallel sides): (side a + side b) ÷ 2 × height. Sides of 10 and 14 ft, 8 ft apart, make
      ${num(trap.squareFeet)} sq ft.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="sqft-units-heading">
    <h2 id="sqft-units-heading">Measuring in inches or meters</h2>
    <p>Convert before you multiply, or convert the answer: there are 12 inches in a foot, so 144 square inches in a square foot
    (<a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>). A floor measured as 144 × 168 inches is ${num(inches.squareInches, 0)} sq in ÷ 144 =
    ${num(inches.squareFeet)} sq ft. A foot is exactly 0.3048 m, so a 4 × 5 m room is 20 m² or ${num(metric.squareFeet)} sq ft.</p>
    ${dataTable({
      id: 'sqft-convert',
      title: 'Square feet in other units',
      columns: [
        { key: 'sqft', label: 'Square feet' },
        { key: 'sqyd', label: 'Square yards', numeric: true },
        { key: 'sqm', label: 'Square meters', numeric: true },
        { key: 'acres', label: 'Acres', numeric: true }
      ],
      rows: TABLE_SQFT.map((value) => {
        const r = calculateSquareFootage({ shape: 'rect', dims: { length: value, width: 1 } });
        return { sqft: num(value), sqyd: num(r.squareYards), sqm: num(r.squareMeters), acres: num(r.acres, 4) };
      })
    })}
  </section>

  <section class="content-section" aria-labelledby="sqft-house-heading">
    <h2 id="sqft-house-heading">Square footage of a house</h2>
    <p>This calculator gives the geometric area of what you measure. The square footage in a listing or an appraisal follows measurement rules about
    what counts, such as whether garages, unfinished basements, stairs or areas with low ceilings are included, so it can differ from the sum of your
    room measurements.</p>
  </section>

  <section class="content-section" aria-labelledby="sqft-method-heading">
    <h2 id="sqft-method-heading">Methodology and testing</h2>
    <p>Dimensions are converted to feet first (1 ft = 12 in = ⅓ yd = 0.3048 m). Square yards = sq ft ÷ 9; square meters = sq ft × 0.09290304;
    acres = sq ft ÷ 43,560. Automated tests check each shape against hand-worked examples, that the same area entered in different units gives the
    same square footage, and the conversions. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/square-footage.js']
  };
}

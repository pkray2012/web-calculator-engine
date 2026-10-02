/**
 * Cubic Yard Calculator page. Example results, both tables and every worked
 * figure in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { cubicYardForm } from '../components/cubic-yard-form.js';
import { cubicYardResults, cubicYardQuickResult } from '../components/cubic-yard-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { CUBIC_YARD_DEFAULTS, parseCubicYardForm, buildCubicYardView } from '../adapters/cubic-yard.js';
import { volumeNeeded, areaCovered, CUBIC_METERS_PER_YARD } from '../calculators/cubic-yard.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

const DEPTHS = [1, 2, 3, 4, 6, 8, 12];
const BAG_SIZES = [0.75, 1, 1.5, 2, 3];

function exampleView(overrides = {}) {
  return buildCubicYardView(parseCubicYardForm({ ...CUBIC_YARD_DEFAULTS, ...overrides }).input);
}

export function cubicYardPage() {
  const calculator = findCalculator('cubic-yard-calculator');
  // The example is in volume mode, so it carries the volume-mode fields.
  const example = /** @type {ReturnType<typeof volumeNeeded> & { input: any, mode: string }} */ (exampleView());
  const { input } = example;
  const circle = volumeNeeded({ shape: 'round', diameterFeet: 6, depthInches: 3 });
  const triangle = volumeNeeded({ shape: 'triangle', baseFeet: 8, heightFeet: 6, depthInches: 3 });
  const holes = volumeNeeded({ shape: 'round', diameterFeet: 10 / 12, depthInches: 24, count: 8 });
  const oneYard = areaCovered({ cubicYards: 1, depthInches: 3 });
  const settled = volumeNeeded({ shape: 'rect', lengthFeet: 12, widthFeet: 10, depthInches: 3, extraPercent: 15 });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how many cubic yards of soil, fill dirt, sand, compost, mulch or gravel an area needs, or how much ground a delivery
  will cover. Rectangles, circles and triangles, several areas at once, and the same amount in cubic feet, cubic meters, bags and truckloads.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your area and depth',
    form: cubicYardForm(CUBIC_YARD_DEFAULTS, {}, cubicYardQuickResult(example)),
    exampleNote: `Example: a ${input.lengthFeet} × ${input.widthFeet} ft bed filled ${input.depthInches} inches deep, with ${input.extraPercent}% extra, in ${input.bagCubicFeet} cu ft bags. Enter your numbers to update.`,
    results: cubicYardResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="cy-how-heading">
    <h2 id="cy-how-heading">How to calculate cubic yards</h2>
    <p>A cubic yard is a cube 3 feet on each side, so it holds 3 × 3 × 3 = 27 cubic feet
    (<a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>). Measure length and width in feet and depth in inches, then:</p>
    <p class="formula"><code>Cubic yards = length (ft) × width (ft) × depth (in) ÷ 12 ÷ 27</code></p>
    <p>For the example bed: ${input.lengthFeet} × ${input.widthFeet} = ${formatCount(example.area)} square feet; × ${input.depthInches} ÷ 12 =
    ${example.netCubicFeet.toFixed(1)} cubic feet; ÷ 27 = ${example.netCubicYards.toFixed(2)} cubic yards. With ${input.extraPercent}% extra that is
    ${example.cubicYards.toFixed(2)} cubic yards, or ${example.bags} bags of ${input.bagCubicFeet} cubic feet.</p>
  </section>

  <section class="content-section" aria-labelledby="cy-shapes-heading">
    <h2 id="cy-shapes-heading">Circles, triangles and irregular areas</h2>
    <ul>
      <li><strong>Circle:</strong> area = π × (diameter ÷ 2)². A round bed 6 ft across is ${circle.area.toFixed(1)} square feet, or
      ${circle.cubicYards.toFixed(2)} cubic yards at 3 inches deep.</li>
      <li><strong>Triangle:</strong> area = base × height ÷ 2, where the height is measured straight out from the base. A corner bed with an 8 ft base and
      6 ft height is ${formatCount(triangle.area)} square feet, or ${triangle.cubicYards.toFixed(2)} cubic yards at 3 inches.</li>
      <li><strong>Several identical areas:</strong> enter how many. Eight post holes 10 inches across and 2 feet deep hold
      ${holes.cubicFeet.toFixed(1)} cubic feet, or ${holes.cubicYards.toFixed(2)} cubic yards.</li>
      <li><strong>Irregular shapes:</strong> split the area into rectangles, circles and triangles, work out each one and add them. For an L-shaped bed,
      use two rectangles.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="cy-cover-heading">
    <h2 id="cy-cover-heading">How much does a cubic yard cover?</h2>
    <p>One cubic yard spreads over 27 ÷ (depth in feet) square feet: ${formatCount(oneYard.area)} square feet at 3 inches deep. Deeper layers cover less.
    Choose “How much area a number of cubic yards covers” above to check a delivery you have already ordered.</p>
    ${dataTable({
      id: 'cy-coverage',
      title: 'Area one cubic yard covers, before settling or waste',
      columns: [{ key: 'depth', label: 'Depth' }, { key: 'area', label: 'Area covered', numeric: true }, { key: 'side', label: 'About the size of', numeric: true }],
      rows: DEPTHS.map((depthInches) => {
        const covered = areaCovered({ cubicYards: 1, depthInches });
        const side = Math.round(covered.squareSideFeet);
        return { depth: `${depthInches} in`, area: `${formatCount(Math.round(covered.area))} sq ft`, side: `${side} × ${side} ft` };
      })
    })}
  </section>

  <section class="content-section" aria-labelledby="cy-bags-heading">
    <h2 id="cy-bags-heading">Cubic yards, cubic feet, cubic meters and bags</h2>
    <p>One cubic yard is 27 cubic feet or ${CUBIC_METERS_PER_YARD.toFixed(3)} cubic meters (a yard is exactly 0.9144 meter). Bagged soil, compost and
    mulch are sold by the cubic foot, so divide the cubic feet by the bag size and round up.</p>
    ${dataTable({
      id: 'cy-bags',
      title: 'Bags in one cubic yard',
      columns: [{ key: 'size', label: 'Bag size' }, { key: 'bags', label: 'Bags per cubic yard', numeric: true }],
      rows: BAG_SIZES.map((size) => ({ size: `${size} cu ft`, bags: formatCount(27 / size) }))
    })}
    <p>Bulk material from a landscape supplier is sold by the cubic yard and is usually cheaper than bags for more than a yard or two; compare the
    price per cubic yard, including delivery.</p>
  </section>

  <section class="content-section" aria-labelledby="cy-settle-heading">
    <h2 id="cy-settle-heading">Settling, compaction and waste</h2>
    <p>Loose material settles after it is spread and watered, and fill that is compacted shrinks further, so order a little more than the measured
    volume. The example bed needs ${example.netCubicYards.toFixed(2)} cubic yards as measured, ${example.cubicYards.toFixed(2)} with ${input.extraPercent}%
    extra, or ${settled.cubicYards.toFixed(2)} with 15%. How much a material settles depends on what it is, how wet it is and how it is compacted,
    so ask your supplier for their guidance.</p>
  </section>

  <section class="content-section" aria-labelledby="cy-weight-heading">
    <h2 id="cy-weight-heading">From cubic yards to tons</h2>
    <p>Some materials, especially stone and sand, are sold by weight. Multiply the cubic yards by the material's weight per cubic yard, which your supplier
    can give you; a US ton is 2,000 pounds. Weight varies with the material and its moisture, so this calculator does not assume one.</p>
    <p>For project-specific estimates, use the <a href="/calculators/gravel-calculator/">gravel calculator</a> (tons of stone), the
    <a href="/calculators/concrete-calculator/">concrete calculator</a> (premix bags or ready-mix for slabs and post holes), the
    <a href="/calculators/mulch-calculator/">mulch calculator</a> or the <a href="/calculators/asphalt-calculator/">asphalt calculator</a>.</p>
  </section>

  <section class="content-section" aria-labelledby="cy-assumptions-heading">
    <h2 id="cy-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>The depth is the same across the whole area. For a slope, measure the depth in several places and use the average.</li>
      <li>Results are the volume to order, not a quote: suppliers round deliveries, often to the half or whole yard, and may have a minimum order.</li>
      <li>Bag counts use the bag size you enter; check the label, as sizes vary by product.</li>
      <li>Excavation, grading, edging, fabric and labor are not included.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="cy-method-heading">
    <h2 id="cy-method-heading">Methodology and testing</h2>
    <p>Volume = area × depth ÷ 12 in cubic feet, then ÷ 27 for cubic yards and × 0.764554857984 for cubic meters; coverage runs the same formula in reverse.
    Automated tests check every shape against an independent calculation, confirm that a 9 × 9 ft area 4 inches deep is exactly one cubic yard, and
    check that coverage and volume give back the same numbers. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/cubic-yard.js']
  };
}

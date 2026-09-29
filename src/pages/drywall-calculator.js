/**
 * Drywall Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { drywallForm } from '../components/drywall-form.js';
import { drywallResults, drywallQuickResult } from '../components/drywall-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { DRYWALL_DEFAULTS, parseDrywallForm, buildDrywallView } from '../adapters/drywall.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildDrywallView(parseDrywallForm({ ...DRYWALL_DEFAULTS, ...overrides }).input);
}

export function drywallPage() {
  const calculator = findCalculator('drywall-calculator');
  const example = exampleView();
  const { input } = example;
  const sizes = Object.fromEntries(example.options.map((option) => [option.id, option.sheets]));
  const wallsOnly = exampleView({ includeCeiling: '' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how many sheets of drywall you need for a room's walls and ceiling, after taking out doors and windows and adding extra
  for cuts, and compare 4 × 8, 4 × 10 and 4 × 12 ft sheets. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your room and drywall',
    form: drywallForm(DRYWALL_DEFAULTS, {}, drywallQuickResult(example)),
    exampleNote: `Example: a ${input.lengthFeet} × ${input.widthFeet} ft room with ${input.heightFeet} ft walls and the ceiling, ${input.doors} door and ${input.windows} windows, ${input.wastePercent}% extra, in 4 × 8 ft sheets. Enter your numbers to update.`,
    results: drywallResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="drywall-how-heading">
    <h2 id="drywall-how-heading">How to calculate drywall</h2>
    <ol>
      <li><strong>Walls:</strong> add the room's length and width, double it for the perimeter and multiply by the wall height:
      (${input.lengthFeet} + ${input.widthFeet}) × 2 × ${input.heightFeet} = ${formatCount(example.grossWallArea)} square feet.</li>
      <li><strong>Doors and windows:</strong> subtract their area. ${input.doors} door of ${input.doorArea} sq ft and ${input.windows} windows of
      ${input.windowArea} sq ft take off ${formatCount(example.openingsArea)}, leaving ${formatCount(example.wallArea)}.</li>
      <li><strong>Ceiling:</strong> length × width = ${formatCount(example.ceilingArea)} square feet, for ${formatCount(example.area)} in total.</li>
      <li><strong>Waste:</strong> add ${input.wastePercent}% for cuts and mistakes: ${formatCount(example.areaWithWaste)} square feet.</li>
      <li><strong>Sheets:</strong> divide by the area of one sheet and round up. A 4 × 8 ft sheet is 32 square feet, so
      ${formatCount(example.areaWithWaste)} ÷ 32 → ${formatCount(sizes['4x8'])} sheets. Measure in inches? Divide square inches by 144 for square feet
      (<a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>).</li>
    </ol>
    <p>Walls only, the same room needs ${formatCount(wallsOnly.sheets)} sheets of 4 × 8 ft.</p>
  </section>

  <section class="content-section" aria-labelledby="drywall-size-heading">
    <h2 id="drywall-size-heading">4 × 8, 4 × 10 or 4 × 12 sheets?</h2>
    <p>For the example room, 4 × 8 ft sheets mean ${formatCount(sizes['4x8'])} sheets, 4 × 10 ft sheets ${formatCount(sizes['4x10'])} and 4 × 12 ft sheets
    ${formatCount(sizes['4x12'])}. Longer sheets cover more wall with fewer joints to tape and finish, but they are heavier and harder to carry through
    doors and up stairs, and a sheet that is longer than a wall is wasted in the offcut. Many people hang 4 × 8 sheets by themselves and use longer
    sheets with a helper.</p>
    <p>Thickness does not change the count. Half-inch drywall is common on walls; ceilings and some walls, such as between a garage and the house,
    may call for 5/8-inch or fire-rated board under your local building code.</p>
  </section>

  <section class="content-section" aria-labelledby="drywall-assumptions-heading">
    <h2 id="drywall-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Joint compound, tape, screws and corner bead, which depend on the layout and finish level.</li>
      <li>Rooms that are not rectangular, sloped or vaulted ceilings, and walls of different heights. Work those out wall by wall.</li>
      <li>Installation labor.</li>
    </ul>
    <p>Results are estimates for planning a purchase. A contractor's takeoff for your plans may differ.</p>
  </section>

  <section class="content-section" aria-labelledby="drywall-method-heading">
    <h2 id="drywall-method-heading">Methodology and testing</h2>
    <p>Automated tests compare wall, ceiling and opening areas and sheet counts for every size with an independent calculation, and check that an
    area that is an exact number of sheets is not rounded up an extra sheet. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/drywall.js']
  };
}

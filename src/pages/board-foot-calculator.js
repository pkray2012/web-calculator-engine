/**
 * Board Foot Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { boardFootForm } from '../components/board-foot-form.js';
import { boardFootResults, boardFootQuickResult } from '../components/board-foot-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { BOARD_FOOT_DEFAULTS, parseBoardFootForm, buildBoardFootView } from '../adapters/board-foot.js';
import { boardFeet } from '../calculators/board-foot.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildBoardFootView(parseBoardFootForm({ ...BOARD_FOOT_DEFAULTS, ...overrides }).input);
}

export function boardFootPage() {
  const calculator = findCalculator('board-foot-calculator');
  const example = exampleView();
  const priced = exampleView({ pricePerBoardFoot: '6.50' });
  const [first, second] = example.rows;
  const twoBySix = boardFeet({ thicknessInches: 2, widthInches: 6, lengthFeet: 8 });
  const quarters = [4, 5, 6, 8, 10, 12, 16];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Calculate board feet for one or more stacks of lumber from the thickness, width and length, including quarter-sawn hardwood
  sizes like 4/4 and 8/4, with extra for waste and the cost at a price per board foot. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your lumber',
    form: boardFootForm(BOARD_FOOT_DEFAULTS, {}, boardFootQuickResult(example)),
    exampleNote: `Example: ${first.quantity} boards 4/4 × ${first.widthInches} in × ${first.lengthFeet} ft and ${second.quantity} boards 5/4 × ${second.widthInches} in × ${second.lengthFeet} ft, with ${example.input.wastePercent}% extra. Enter your lumber to update.`,
    results: boardFootResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="bf-formula-heading">
    <h2 id="bf-formula-heading">Board foot formula</h2>
    <p>A board foot is a volume of 144 cubic inches: a board 1 inch thick, 12 inches wide and 1 foot long. For a board T inches thick, W inches
    wide and L feet long:</p>
    <p><code>board feet = T × W × L ÷ 12</code></p>
    <p>If you measure the length in inches, use T × W × L ÷ 144 instead (<a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>).</p>
    <ul>
      <li>A 4/4 board 6 inches wide and 8 feet long: 1 × 6 × 8 ÷ 12 = ${first.each.toFixed(0)} board feet, so ${first.quantity} of them are ${first.total.toFixed(0)}.</li>
      <li>A 5/4 board 8 inches wide and 10 feet long: 1.25 × 8 × 10 ÷ 12 = ${second.each.toFixed(2)} board feet.</li>
      <li>A 2×6 that is 8 feet long: 2 × 6 × 8 ÷ 12 = ${twoBySix} board feet.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="bf-quarters-heading">
    <h2 id="bf-quarters-heading">Quarter sizes and nominal thickness</h2>
    <p>Hardwood thickness is sold in quarters of an inch, measured rough before planing: 4/4 ("four quarter") is 1 inch and 8/4 is 2 inches.
    Board feet are figured on this nominal thickness, so surfaced 4/4 lumber planed to about ¾ inch is still priced as 1 inch. Softwood
    dimensional lumber is also figured on nominal sizes: a 2×6 counts as 2 by 6 inches even though it measures about 1½ by 5½.</p>
    ${dataTable({
      id: 'bf-quarter-table',
      title: 'Quarter sizes in inches',
      columns: [{ key: 'q', label: 'Quarter size' }, { key: 'in', label: 'Nominal thickness', numeric: true }],
      rows: quarters.map((q) => ({ q: `${q}/4`, in: `${q / 4} in` }))
    })}
  </section>

  <section class="content-section" aria-labelledby="bf-cost-heading">
    <h2 id="bf-cost-heading">Waste and cost</h2>
    <p>Rough lumber has knots, splits and uneven edges, and cutting to length leaves offcuts, so buy extra: around 15% for clean stock and up to
    30% or more for lower grades or projects with many small parts. The example needs ${example.total.toFixed(2)} board feet, or ${example.withWaste.toFixed(2)}
    with ${example.input.wastePercent}% extra; at $6.50 a board foot that is ${formatCurrency(priced.cost)}.</p>
  </section>

  <section class="content-section" aria-labelledby="bf-assumptions-heading">
    <h2 id="bf-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Board feet use the thickness and width you enter; enter nominal sizes to match how lumber is priced.</li>
      <li>Lumberyards may round each board to the nearest foot of length or round the total; the result here is not rounded.</li>
      <li>Some lumber, such as trim and dimensional softwood at big-box stores, is priced per piece or per linear foot instead of per board foot.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="bf-method-heading">
    <h2 id="bf-method-heading">Methodology and testing</h2>
    <p>Automated tests check the definition (1 × 12 in × 1 ft = 1 board foot = 144 cubic inches), nominal and quarter sizes, several stacks with
    waste and price, and invalid inputs against hand-worked values. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/board-foot.js']
  };
}

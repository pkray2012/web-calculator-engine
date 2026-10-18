/**
 * Stair Calculator page (draft: registry status "planned", not built into the
 * site until its code citations are verified directly). Example results and
 * every worked figure are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { stairForm } from '../components/stair-form.js';
import { stairResults, stairQuickResult, formatInches } from '../components/stair-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { STAIR_DEFAULTS, parseStairForm, buildStairView } from '../adapters/stair.js';
import { calculateStairs } from '../calculators/stair.js';
import { findCalculator, relatedCalculators } from '../content/site.js';

/**
 * Pending direct verification: the R311.7 values were confirmed only through
 * local building-department summaries of the 2021 IRC (audit A-019), not the
 * ICC text itself. Move to src/content/sources.js once read directly.
 */
export const STAIR_SOURCES = Object.freeze({
  irc2021Stairways: {
    title: '2021 International Residential Code, Section R311.7 Stairways',
    publisher: 'International Code Council',
    url: 'https://codes.iccsafe.org/content/IRC2021P2/chapter-3-building-planning#IRC2021P2_Pt03_Ch03_SecR311.7',
    supports: 'Residential stairs: riser height not more than 7¾ inches and tread depth not less than 10 inches (R311.7.5); headroom not less than 6 feet 8 inches (R311.7.2); handrails on flights with four or more risers (R311.7.8).'
  }
});

const RISE_TABLE = [24, 36, 48, 72, 96, 108, 120];

export function stairPage() {
  const calculator = findCalculator('stair-calculator');
  const example = buildStairView(parseStairForm(STAIR_DEFAULTS).input);
  const s = example.result;
  const naive = Math.hypot(s.totalRise, s.totalRun);

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how many steps a stair needs, the exact riser height, the total run and the stringer layout from the floor-to-floor
  height, and check each riser count against the limits your local code sets. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your stair',
    form: stairForm(STAIR_DEFAULTS, {}, stairQuickResult(example)),
    exampleNote: `Example: a ${formatInches(s.totalRise)} (9 ft) floor-to-floor rise with ${formatInches(s.treadDepth)} treads. Enter your own measurements to update.`,
    results: stairResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="stair-how-heading">
    <h2 id="stair-how-heading">How to calculate stair risers and treads</h2>
    <ol>
      <li>Measure the total rise from finished floor to finished floor: ${formatInches(s.totalRise)}.</li>
      <li>Divide by the maximum riser height and round up: ${s.totalRise} ÷ ${s.maxRiser} = ${(s.totalRise / s.maxRiser).toFixed(2)}, so ${s.risers} risers.</li>
      <li>Divide the rise by that count for equal risers: ${s.totalRise} ÷ ${s.risers} = ${s.riserHeight.toFixed(3)} in, about ${formatInches(s.riserHeight)}.</li>
      <li>There is one fewer tread than risers, because the upper floor is the last step: ${s.treads} treads.</li>
      <li>Multiply treads by tread depth for the total run: ${s.treads} × ${formatInches(s.treadDepth)} = ${formatInches(s.totalRun, { feet: true })}.</li>
    </ol>
    <p class="formula"><code>risers = ⌈total rise ÷ max riser⌉ · riser = total rise ÷ risers · run = (risers − 1) × tread</code></p>
  </section>

  <section class="content-section" aria-labelledby="stair-stringer-heading">
    <h2 id="stair-stringer-heading">Stringer length</h2>
    <p>Each step adds one riser and one tread along the slope: √(${s.riserHeight.toFixed(3)}² + ${s.treadDepth}²) = ${s.stepUnit.toFixed(3)} in. The pitch line from the
    bottom nosing to the top nosing covers the ${s.treads} treads, ${formatInches(s.pitchLength, { feet: true })}. The board itself must also reach from the
    floor to the top riser: the stringer spans ${formatInches(s.totalRun, { feet: true })} of run and ${formatInches(s.totalRise - s.treadThickness, { feet: true })} of rise,
    which along the slope is at least ${formatInches(s.minimumBoardLength, { feet: true, up: true })}, before any allowance for the top connection.</p>
    <p>A common shortcut is the diagonal of the total rise and total run, ${formatInches(naive, { feet: true })} here. It gives a similar length, but it is
    not the stair's slope (${(Math.atan2(s.totalRise, s.totalRun) * 180 / Math.PI).toFixed(1)}° instead of ${s.angleDegrees.toFixed(1)}°), so do not use it to mark the cuts.</p>
    <p>Treads fastened on top of the stringer raise every step by their thickness, but only the bottom step starts from the floor. Cutting
    ${formatInches(s.treadThickness)} off the bottom of the stringer keeps the first step the same height as the rest.</p>
  </section>

  <section class="content-section" aria-labelledby="stair-table-heading">
    <h2 id="stair-table-heading">Risers for common floor heights (${s.maxRiser} in maximum, ${formatInches(s.treadDepth)} treads)</h2>
    ${dataTable({
      id: 'stair-table',
      title: 'Riser count and height by total rise',
      columns: [
        { key: 'rise', label: 'Total rise' },
        { key: 'risers', label: 'Risers', numeric: true },
        { key: 'height', label: 'Riser height', numeric: true },
        { key: 'run', label: 'Total run', numeric: true }
      ],
      rows: RISE_TABLE.map((rise) => {
        const row = calculateStairs({ totalRise: rise, treadDepth: s.treadDepth, maxRiser: s.maxRiser, minTread: s.minTread });
        return {
          rise: formatInches(rise, { feet: true }),
          risers: String(row.risers),
          height: formatInches(row.riserHeight),
          run: formatInches(row.totalRun, { feet: true })
        };
      })
    })}
  </section>

  <section class="content-section" aria-labelledby="stair-code-heading">
    <h2 id="stair-code-heading">Building code limits</h2>
    <p>The 2021 International Residential Code, which many US states and cities adopt with their own changes, limits residential risers to 7¾ in and
    requires treads of at least 10 in, with no more than ⅜ in difference between the tallest and shortest riser or the deepest and shallowest tread in a
    flight. It also sets headroom, stair width, nosing and handrail rules that this calculator does not check. Your building department decides which
    edition and amendments apply, so the limits in the form can be changed.</p>
  </section>

  <section class="content-section" aria-labelledby="stair-assumptions-heading">
    <h2 id="stair-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>A straight stair with equal risers and equal treads, and the upper floor as the top step. Landings, winders and spiral stairs are not covered.</li>
      <li>The total rise is between finished floors. If flooring will be added later, include its thickness.</li>
      <li>Headroom, width, nosing, guards and handrail height are not checked.</li>
      <li>Lengths are shown to the nearest 1/16 in. Lay out the stringer with a framing square and confirm each mark before cutting.</li>
      <li>Results are estimates, not a code approval. Check with your building department.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="stair-method-heading">
    <h2 id="stair-method-heading">Methodology and testing</h2>
    <p>Automated tests check a hand-worked 9 ft stair, rises that are exact multiples of the maximum riser (so no extra step is added by rounding),
    that the board length equals the stringer's span projected onto the slope, and 2,000 random rises for the fewest risers within the limit.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection(Object.values(STAIR_SOURCES))}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/stair.js']
  };
}

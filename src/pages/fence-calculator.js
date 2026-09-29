/**
 * Fence Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { fenceForm } from '../components/fence-form.js';
import { fenceResults, fenceQuickResult } from '../components/fence-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { FENCE_DEFAULTS, parseFenceForm, buildFenceView } from '../adapters/fence.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildFenceView(parseFenceForm({ ...FENCE_DEFAULTS, ...overrides }).input);
}

export function fencePage() {
  const calculator = findCalculator('fence-calculator');
  const example = exampleView();
  const { input } = example;
  const sixFoot = exampleView({ postSpacingFeet: '6' });
  const spaced = exampleView({ picketWidthInches: '3.5', gapInches: '3.5', railsPerSection: '2' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how many posts, rails and pickets you need for a wood or picket fence from its length, post spacing and board size,
  with extra pickets for waste and an optional materials cost. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your fence',
    form: fenceForm(FENCE_DEFAULTS, {}, fenceQuickResult(example)),
    exampleNote: `Example: ${input.lengthFeet} ft of fence with posts every ${input.postSpacingFeet} ft, ${input.railsPerSection} rails per section, and ${input.picketWidthInches}-inch pickets with a ${input.gapInches}-inch gap and ${input.wastePercent}% extra. Enter your numbers to update.`,
    results: fenceResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="fence-how-heading">
    <h2 id="fence-how-heading">How to calculate fence materials</h2>
    <ol>
      <li><strong>Sections:</strong> divide the length by the post spacing and round up: ${input.lengthFeet} ÷ ${input.postSpacingFeet} →
      ${formatCount(example.sections)} sections of ${example.sectionLengthFeet.toFixed(2)} feet.</li>
      <li><strong>Posts:</strong> one more than the number of sections, because each end needs a post: ${formatCount(example.posts)} posts for a single
      straight run.</li>
      <li><strong>Rails:</strong> sections × rails per section: ${formatCount(example.sections)} × ${input.railsPerSection} = ${formatCount(example.rails)} rails, each as
      long as a section.</li>
      <li><strong>Pickets:</strong> convert the length to inches (1 foot = 12 inches;
      <a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>). With a gap between boards, n pickets cover
      n × width + (n − 1) × gap, so you need (length + gap) ÷ (width + gap), rounded up: ${formatCount(example.picketsExact)} pickets, or
      ${formatCount(example.pickets)} with ${input.wastePercent}% extra.</li>
    </ol>
  </section>

  <section class="content-section" aria-labelledby="fence-choices-heading">
    <h2 id="fence-choices-heading">Post spacing and picket layout</h2>
    <p>Closer posts make a stiffer fence but cost more: at ${sixFoot.input.postSpacingFeet}-foot spacing, the example needs ${formatCount(sixFoot.posts)} posts
    instead of ${formatCount(example.posts)}. For a spaced picket fence with ${spaced.input.picketWidthInches}-inch pickets and ${spaced.input.gapInches}-inch gaps
    and two rails, it takes ${formatCount(spaced.pickets)} pickets. Local rules can limit fence height or placement near property lines, and in many places
    you must call 811 before digging post holes.</p>
  </section>

  <section class="content-section" aria-labelledby="fence-assumptions-heading">
    <h2 id="fence-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Gates and their posts and hardware. Leave the gate width out of the length and add gates separately.</li>
      <li>Corners and separate runs: each separate straight run needs its own end posts, so work out each run separately.</li>
      <li>Concrete or gravel for post holes, post caps, screws or nails, stain and labor.</li>
    </ul>
    <p>Results are estimates for planning a purchase.</p>
  </section>

  <section class="content-section" aria-labelledby="fence-method-heading">
    <h2 id="fence-method-heading">Methodology and testing</h2>
    <p>Automated tests compare sections, posts, rails and pickets with an independent calculation, check the picket count against a board-by-board
    count, and check that a length that is an exact number of sections does not get an extra post. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/fence.js']
  };
}

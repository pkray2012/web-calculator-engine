/**
 * Deck Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCount } from '../lib/format.js';
import { deckForm } from '../components/deck-form.js';
import { deckResults, deckQuickResult } from '../components/deck-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { DECK_DEFAULTS, parseDeckForm, buildDeckView } from '../adapters/deck.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildDeckView(parseDeckForm({ ...DECK_DEFAULTS, ...overrides }).input);
}

export function deckPage() {
  const calculator = findCalculator('deck-calculator');
  const example = exampleView();
  const { input } = example;
  const twelveInch = exampleView({ joistSpacingInches: '12' });
  const wide = exampleView({ widthFeet: '20' });
  const wideTwenties = exampleView({ widthFeet: '20', boardLengthFeet: '20' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how many deck boards, joists and screws a rectangular deck needs from its size, board width and length, gap and joist
  spacing, with extra boards for waste and an optional materials cost. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your deck',
    form: deckForm(DECK_DEFAULTS, {}, deckQuickResult(example)),
    exampleNote: `Example: a ${input.widthFeet} × ${input.depthFeet} ft deck of ${input.boardLengthFeet}-ft boards ${input.boardWidthInches} inches wide with a ${input.gapInches}-inch gap, joists ${input.joistSpacingInches} inches on center and ${input.wastePercent}% extra. Enter your numbers to update.`,
    results: deckResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="deck-how-heading">
    <h2 id="deck-how-heading">How to calculate deck boards</h2>
    <ol>
      <li><strong>Rows of boards:</strong> convert the depth to inches (1 foot = 12 inches;
      <a href="${SOURCES.nistUnits.url}">NIST: tables of units of measurement</a>). With a gap between boards, n boards cover
      n × width + (n − 1) × gap, so the rows are (depth + gap) ÷ (board width + gap), rounded up: (${input.depthFeet * 12} + ${input.gapInches}) ÷
      (${input.boardWidthInches} + ${input.gapInches}) → ${formatCount(example.rows)} rows.</li>
      <li><strong>Boards per row:</strong> the deck width divided by the board length, rounded up: ${input.widthFeet} ÷ ${input.boardLengthFeet} →
      ${formatCount(example.boardsPerRow)}.</li>
      <li><strong>Boards:</strong> rows × boards per row = ${formatCount(example.boardsExact)}, plus ${input.wastePercent}% extra = ${formatCount(example.boards)} boards.</li>
      <li><strong>Joists:</strong> the width in inches divided by the spacing, rounded up, plus one for the end:
      ${input.widthFeet * 12} ÷ ${input.joistSpacingInches} + 1 = ${formatCount(example.joists)} joists, each ${input.depthFeet} feet long.</li>
      <li><strong>Screws:</strong> rows × joists × screws per crossing = ${formatCount(example.rows)} × ${formatCount(example.joists)} × ${input.screwsPerCrossing} =
      ${formatCount(example.screws)}. Hidden fastener systems use one clip per crossing instead; follow the maker's instructions.</li>
    </ol>
  </section>

  <section class="content-section" aria-labelledby="deck-choices-heading">
    <h2 id="deck-choices-heading">Board length and joist spacing</h2>
    <p><strong>Pick board lengths that fit the width.</strong> A ${wide.input.widthFeet}-foot-wide deck needs ${formatCount(wide.boardsPerRow)} sixteen-foot boards
    per row (${formatCount(wide.boards)} boards with extra, and most of each second board is cut off), but ${formatCount(wideTwenties.boardsPerRow)} twenty-foot board per row
    (${formatCount(wideTwenties.boards)} boards). Where boards meet end to end, the joint has to land on a joist.</p>
    <p><strong>Closer joists mean more framing and more screws.</strong> At 12 inches on center the example needs ${formatCount(twelveInch.joists)} joists and
    ${formatCount(twelveInch.screws)} screws, against ${formatCount(example.joists)} and ${formatCount(example.screws)} at 16 inches. Composite and PVC board makers
    publish the joist spacing their boards need, often closer for diagonal layouts; use the smaller of that and your code's requirement.</p>
  </section>

  <section class="content-section" aria-labelledby="deck-assumptions-heading">
    <h2 id="deck-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li><strong>Structure.</strong> Joist size and span, beams, posts, footings, the ledger and its attachment to the house, and rim joists are
      set by the building code where you live and by the load the deck carries. Many places require a permit for a deck; check with your local
      building department.</li>
      <li>Diagonal or picture-frame board layouts, which use more boards and need different joist spacing.</li>
      <li>Stairs, railings, joist hangers, flashing, stain and labor.</li>
    </ul>
    <p>Results are estimates for planning a purchase, not a structural design.</p>
  </section>

  <section class="content-section" aria-labelledby="deck-method-heading">
    <h2 id="deck-method-heading">Methodology and testing</h2>
    <p>Automated tests compare rows, boards, joists and screws with an independent calculation, check the row count against a board-by-board
    layout, and check that sizes that divide exactly do not get an extra row, board or joist. <a href="/about/">How we build and test calculators</a>.</p>
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
    scripts: ['client/deck.js']
  };
}

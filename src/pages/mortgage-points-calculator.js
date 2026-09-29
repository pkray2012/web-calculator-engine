/**
 * Mortgage Points Calculator page. Example results and every worked figure in
 * the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { mortgagePointsForm } from '../components/mortgage-points-form.js';
import { mortgagePointsResults, mortgagePointsQuickResult } from '../components/mortgage-points-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { POINTS_DEFAULTS, parsePointsForm, buildPointsView } from '../adapters/mortgage-points.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildPointsView(parsePointsForm({ ...POINTS_DEFAULTS, ...overrides }).input);
}

export function mortgagePointsPage() {
  const calculator = findCalculator('mortgage-points-calculator');
  const example = exampleView();
  const { input } = example;
  const shortStay = exampleView({ stayYears: '3' });
  const twoPoints = exampleView({ points: '2', pointsRate: '6.5' });
  const weakPoints = exampleView({ points: '2', pointsRate: '6.85' });
  const sources = [SOURCES.pointsAndCredits, SOURCES.discountPointsResearch, SOURCES.loanEstimate];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Compare a mortgage quote with discount points against the same loan without them. See what the points cost, how much they lower the payment,
  the month they pay for themselves, and whether you come out ahead if you sell or refinance after a few years. Principal and interest only; your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your loan and the two quotes',
    form: mortgagePointsForm(POINTS_DEFAULTS, {}, mortgagePointsQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.loanAmount)} over ${formatDuration(input.termMonths)} at ${formatPercent(input.baseRate)} with no points, or ${formatPercent(input.pointsRate)} for ${input.points} point (illustrative pricing, not a lender quote). Enter your numbers to update.`,
    results: mortgagePointsResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="what-heading">
    <h2 id="what-heading">What discount points are</h2>
    <p>Discount points are an upfront fee paid at closing in exchange for a lower interest rate. One point costs 1% of the loan amount, so one point on
    ${formatCurrency(input.loanAmount)} is ${formatCurrency(example.pointsCost)}. How much a point lowers the rate is not fixed: it depends on the lender and the market,
    so this calculator asks for the rate your lender actually quotes instead of assuming a standard reduction
    (<a href="${SOURCES.pointsAndCredits.url}">CFPB: lender credits and points</a>). Lender credits work the other way: a higher rate in exchange for lower closing costs.</p>
    <p>Points appear in the loan costs on your <a href="${SOURCES.loanEstimate.url}">Loan Estimate</a>, so you can ask a lender for quotes with and without points and compare them here.</p>
  </section>

  <section class="content-section" aria-labelledby="definitions-heading">
    <h2 id="definitions-heading">Two ways to measure break-even</h2>
    <dl class="definitions">
      <dt>Simple break-even</dt>
      <dd>Cost of the points ÷ monthly payment savings: the rule of thumb most calculators show. In the example:
      ${formatCurrency(example.pointsCost)} ÷ ${formatCurrency(example.monthlySavings)} = ${example.simpleBreakEvenMonths.toFixed(1)} months.</dd>
      <dt>True break-even</dt>
      <dd>The first month in which the points option has cost less in total, counting the payments made, the balance you would still owe if you sold or refinanced then,
      and the points. In the example it is <strong>month ${example.breakEvenMonth}</strong>.</dd>
    </dl>
    <p>The true break-even comes sooner because a lower rate sends more of each payment to principal, so the balance you owe falls faster. With the same loan amount and term,
    the difference between the two options at any point is exactly the interest saved so far minus the points, so once the points break even they stay ahead.</p>
  </section>

  <section class="content-section" aria-labelledby="stay-heading">
    <h2 id="stay-heading">How long you keep the loan decides it</h2>
    <p>Points only pay off if you keep the loan past the break-even point; selling or refinancing earlier means you paid for savings you did not collect
    (<a href="${SOURCES.discountPointsResearch.url}">CFPB research on discount points</a>). In the example, keeping the loan ${formatDuration(example.stay.months)} saves
    ${formatCurrency(example.stay.netSavings)}, but refinancing after ${formatDuration(shortStay.stay.months)} leaves you ${formatCurrency(-shortStay.stay.netSavings)} worse off.
    The CFPB suggests comparing the shortest, longest and most likely time you might keep the loan; the table under the results shows each checkpoint.</p>
  </section>

  <section class="content-section" aria-labelledby="per-point-heading">
    <h2 id="per-point-heading">Not every point is worth the same</h2>
    <p>Two points that bring the rate from ${formatPercent(twoPoints.input.baseRate)} to ${formatPercent(twoPoints.input.pointsRate)} cost
    ${formatCurrency(twoPoints.pointsCost)}, save ${formatCurrency(twoPoints.monthlySavings)} a month and break even in month ${twoPoints.breakEvenMonth}.
    If the same two points only brought the rate to ${formatPercent(weakPoints.input.pointsRate)}, they would save ${formatCurrency(weakPoints.monthlySavings)} a month and
    ${weakPoints.breakEvenMonth === null ? 'never break even' : html`not break even until month ${weakPoints.breakEvenMonth} (${formatDuration(weakPoints.breakEvenMonth)})`}.
    Compare the actual rate each quote offers, not the number of points.</p>
  </section>

  <section class="content-section" aria-labelledby="points-how-heading">
    <h2 id="points-how-heading">How the comparison is calculated</h2>
    <ol>
      <li>Cost of the points = number of points × 1% of the loan amount, paid in cash at closing.</li>
      <li>Each quote's payment is the fixed-rate payment <code>P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</code>, where r is the annual rate ÷ 12 and n is the
      number of months: the same formula as our <a href="/calculators/loan-payment-calculator/">loan payment calculator</a>.</li>
      <li>Both loans are amortized month by month. For every month, each option's cost is payments made so far + balance still owed, plus the points for the points option.</li>
      <li>The break-even month is the first month the points option costs less. The same comparison powers our
      <a href="/calculators/mortgage-refinance-calculator/">mortgage refinance calculator</a>.</li>
    </ol>
    <p>Amounts are calculated at full precision and rounded to cents only for display.</p>
  </section>

  <section class="content-section" aria-labelledby="points-assumptions-heading">
    <h2 id="points-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Other closing costs, property taxes, homeowners insurance, mortgage insurance (PMI) and escrow. These are usually the same for both quotes.</li>
      <li>What the cash could earn if you did not spend it on points, and any tax treatment of points. Ask a tax professional about deductibility.</li>
      <li>Financing the points into the loan, lender credits, temporary buydowns and adjustable-rate loans.</li>
      <li>Rates stay fixed, with monthly payments and interest at the annual rate ÷ 12. No lender's pricing is assumed. Results are estimates, not a loan offer or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="points-method-heading">
    <h2 id="points-method-heading">Methodology and testing</h2>
    <p>Both quotes use the same tested amortization engine as every loan calculator on this site. Automated tests check the break-even month and the savings at each
    checkpoint against independent closed-form balance calculations for 300 random loans, including zero-rate and no-points cases.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection(sources)}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/mortgage-points.js']
  };
}

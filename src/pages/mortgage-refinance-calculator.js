/**
 * Mortgage Refinance Calculator page. Example results and every worked figure
 * in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { refinanceForm } from '../components/refinance-form.js';
import { refinanceResults, refinanceQuickResult, aheadText } from '../components/refinance-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { REFI_DEFAULTS, parseRefiForm, buildRefiView } from '../adapters/mortgage-refinance.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildRefiView(parseRefiForm({ ...REFI_DEFAULTS, ...overrides }).input);
}

export function mortgageRefinancePage() {
  const calculator = findCalculator('mortgage-refinance-calculator');
  const example = exampleView();
  const { input } = example;

  // Same remaining term, lower rate, cash closing costs.
  const sameTerm = exampleView({ newTermValue: REFI_DEFAULTS.currentTermValue });
  // Term reset with financed costs and a small rate drop.
  const reset = exampleView({ currentBalance: '300000', currentRate: '6.5', currentTermValue: '25', newRate: '6', newTermValue: '30', closingCosts: '8000', financeClosingCosts: 'on', stayYears: '3' });
  // Shorter term: payment rises.
  const shorter = exampleView({ currentBalance: '250000', currentRate: '6.75', currentTermValue: '20', newRate: '5.25', newTermValue: '15', closingCosts: '5000', stayYears: '' });
  // Same refinance with closing costs added to the loan.
  const financed = exampleView({ financeClosingCosts: 'on' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Compare keeping your current mortgage with refinancing. See the new payment, when refinancing actually comes out ahead once the balance you
  still owe is counted, and what it saves or costs if you sell after 3, 5 or 10 years. Principal and interest only; your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your mortgage and the new loan',
    form: refinanceForm(REFI_DEFAULTS, {}, refinanceQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.currentBalance)} at ${formatPercent(input.currentRate)} with ${formatDuration(input.currentTermMonths)} left, refinanced to ${formatPercent(input.newRate)} for ${formatDuration(input.newTermMonths)} with ${formatCurrency(input.closingCosts)} closing costs (illustrative rates). Enter your numbers to update.`,
    results: refinanceResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="definitions-heading">
    <h2 id="definitions-heading">Two ways to measure break-even</h2>
    <dl class="definitions">
      <dt>Simple break-even</dt>
      <dd>Closing costs ÷ monthly payment savings. It is the number most refinance calculators show. In the example:
      ${formatCurrency(input.closingCosts)} ÷ ${formatCurrency(example.monthlySavings)} = ${example.simpleBreakEvenMonths.toFixed(1)} months.</dd>
      <dt>True break-even</dt>
      <dd>The first month in which refinancing has cost less in total, counting the payments you have made, the balance you would still owe if you sold or paid off
      then, and any closing costs you paid in cash. In the example it is <strong>${aheadText(example).toLowerCase()}</strong>.</dd>
    </dl>
    <p>The two can disagree because a new loan pays down its balance at a different speed. A lower rate sends more of each payment to principal, which can make the
    true break-even earlier; a longer new term or financed closing costs leave a larger balance, which can make it later or mean it never arrives.</p>
  </section>

  <section class="content-section" aria-labelledby="refi-how-heading">
    <h2 id="refi-how-heading">How the comparison is calculated</h2>
    <ol>
      <li>The current loan's payment is the fixed-rate payment on your balance over the time left:
      <code>P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</code>, where r is the annual rate ÷ 12 and n is the number of months.
      The same formula powers our <a href="/calculators/loan-payment-calculator/">loan payment calculator</a>.</li>
      <li>The new loan uses the same formula on your balance (plus closing costs, if you add them to the loan) over the new term.</li>
      <li>Both loans are amortized month by month. For every month, each option's cost is payments made so far + balance still owed + closing costs paid in cash.</li>
      <li>Refinancing is ahead in any month where its cost is lower. Lifetime savings compare both loans run to payoff.</li>
    </ol>
    <p>Amounts are calculated at full precision and rounded to cents only for display.</p>
  </section>

  <section class="content-section" aria-labelledby="same-term-heading">
    <h2 id="same-term-heading">Lower rate, same payoff date</h2>
    <p>Refinancing ${formatCurrency(sameTerm.input.currentBalance)} from ${formatPercent(sameTerm.input.currentRate)} to ${formatPercent(sameTerm.input.newRate)}
    while keeping the same ${formatDuration(sameTerm.input.newTermMonths)} lowers the payment by ${formatCurrency(sameTerm.monthlySavings)} a month.
    It comes out ahead ${aheadText(sameTerm).toLowerCase()} and saves ${formatCurrency(sameTerm.lifetimeSavings)} over the life of the loan,
    because the lower rate also pays the balance down faster.</p>
  </section>

  <section class="content-section" aria-labelledby="reset-heading">
    <h2 id="reset-heading">When a lower payment still costs more</h2>
    <p>Resetting to a new 30-year term spreads the balance over more payments, so the payment drops even if the rate barely changes, but you pay interest for longer.
    For example, refinancing ${formatCurrency(reset.input.currentBalance)} with ${formatDuration(reset.input.currentTermMonths)} left from
    ${formatPercent(reset.input.currentRate)} to ${formatPercent(reset.input.newRate)} over 30 years, with ${formatCurrency(reset.input.closingCosts)} of closing costs added to the loan,
    cuts the payment by ${formatCurrency(reset.monthlySavings)}. The simple break-even says ${reset.simpleBreakEvenMonths.toFixed(1)} months, but counting the larger balance,
    the refinance is <strong>${aheadText(reset).toLowerCase()}</strong>: after 3 years you would be ${formatCurrency(-reset.stay.netSavings)} worse off, and
    ${formatCurrency(-reset.lifetimeSavings)} worse off over both full terms.</p>
  </section>

  <section class="content-section" aria-labelledby="shorter-heading">
    <h2 id="shorter-heading">Refinancing to a shorter term</h2>
    <p>Moving ${formatCurrency(shorter.input.currentBalance)} from ${formatPercent(shorter.input.currentRate)} with ${formatDuration(shorter.input.currentTermMonths)} left to
    ${formatPercent(shorter.input.newRate)} for ${formatDuration(shorter.input.newTermMonths)} raises the payment by ${formatCurrency(-shorter.monthlySavings)}, so the simple
    break-even never arrives. Yet the refinance is ahead ${aheadText(shorter).toLowerCase()}, because the balance falls much faster, and saves
    ${formatCurrency(shorter.lifetimeSavings)} over the life of the loan.</p>
  </section>

  <section class="content-section" aria-labelledby="costs-heading">
    <h2 id="costs-heading">Paying closing costs in cash vs. adding them to the loan</h2>
    <p>Adding closing costs to the loan avoids paying them at closing but increases the balance you pay interest on. In the example, paying
    ${formatCurrency(input.closingCosts)} in cash gives a true break-even ${aheadText(example).toLowerCase()} and lifetime savings of ${formatCurrency(example.lifetimeSavings)};
    adding it to the loan gives a new payment of ${formatCurrency(financed.refinance.payment)}, a true break-even ${aheadText(financed).toLowerCase()} and lifetime savings of
    ${formatCurrency(financed.lifetimeSavings)}. Your <a href="${SOURCES.loanEstimate.url}">Loan Estimate</a> lists the expected closing costs for a refinance, and your
    <a href="${SOURCES.closingDisclosure.url}">Closing Disclosure</a> shows the final amounts (explainers from the Consumer Financial Protection Bureau).</p>
  </section>

  <section class="content-section" aria-labelledby="refi-assumptions-heading">
    <h2 id="refi-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Property taxes, homeowners insurance, mortgage insurance (PMI) and escrow. These usually continue either way, but can change with a new loan.</li>
      <li>Discount points, lender credits, cash-out refinancing and prepayment penalties.</li>
      <li>Tax effects, investment returns on cash you keep, and the costs of selling a home.</li>
      <li>Rates stay fixed for both loans, with monthly payments and interest at the annual rate ÷ 12. Adjustable-rate loans are not modeled.</li>
      <li>No rates are assumed for any lender. Enter the rate and costs from your own quote. Results are estimates, not a loan offer or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="refi-method-heading">
    <h2 id="refi-method-heading">Methodology and testing</h2>
    <p>Both loans use the same tested amortization engine as every loan calculator on this site. Automated tests check the planned-stay savings, true break-even month
    and lifetime savings against an independent month-by-month simulation, including term resets, financed closing costs and shorter terms.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.loanEstimate, SOURCES.closingDisclosure])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/mortgage-refinance.js']
  };
}

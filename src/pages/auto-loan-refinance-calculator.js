/**
 * Auto Loan Refinance Calculator page. Example results and every worked figure
 * in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { autoRefinanceForm } from '../components/auto-refinance-form.js';
import { autoRefinanceResults, autoRefinanceQuickResult } from '../components/auto-refinance-results.js';
import { aheadText } from '../components/refinance-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { AUTO_REFI_DEFAULTS, parseAutoRefiForm, buildAutoRefiView } from '../adapters/auto-loan-refinance.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildAutoRefiView(parseAutoRefiForm({ ...AUTO_REFI_DEFAULTS, ...overrides }).input);
}

export function autoLoanRefinancePage() {
  const calculator = findCalculator('auto-loan-refinance-calculator');
  const example = exampleView();
  const { input } = example;
  const stretched = exampleView({ newTermValue: '72' });
  const stretchedHigher = exampleView({ newRate: '8.5', newTermValue: '72' });
  const financed = exampleView({ prepaymentPenalty: '200', financeCosts: 'on' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Compare keeping your car loan with refinancing it. See the new payment, the total you save or lose after fees, and whether refinancing
  still comes out ahead if you sell or trade in the car early. Principal and interest only; your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your car loan and the offer',
    form: autoRefinanceForm(AUTO_REFI_DEFAULTS, {}, autoRefinanceQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.currentBalance)} at ${formatPercent(input.currentRate)} with ${formatDuration(input.currentTermMonths)} left, refinanced to ${formatPercent(input.newRate)} for ${formatDuration(input.newTermMonths)} with ${formatCurrency(input.fees)} in fees (illustrative rates). Enter your numbers to update.`,
    results: autoRefinanceResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="same-term-heading">
    <h2 id="same-term-heading">A lower rate with the same payoff date</h2>
    <p>Refinancing ${formatCurrency(input.currentBalance)} from ${formatPercent(input.currentRate)} to ${formatPercent(input.newRate)} while keeping the same
    ${formatDuration(input.newTermMonths)} lowers the payment by ${formatCurrency(example.monthlySavings)} a month. After the ${formatCurrency(input.fees)} fee it saves
    ${formatCurrency(example.lifetimeSavings)} in total and is ahead ${aheadText(example).toLowerCase()}. Keeping the payoff date is the cleanest way to see what the
    lower rate alone is worth.</p>
  </section>

  <section class="content-section" aria-labelledby="longer-heading">
    <h2 id="longer-heading">A lower payment is not always a saving</h2>
    <p>A longer loan term can lower the monthly payment but add interest over the life of the loan
    (<a href="${SOURCES.compareAutoLoans.url}">CFPB: comparing auto loan offers</a>). Stretching the same refinance to ${formatDuration(stretched.input.newTermMonths)}
    cuts the payment to ${formatCurrency(stretched.refinance.payment)}, but over the whole loan it ${stretched.lifetimeSavings >= 0 ? `saves only ${formatCurrency(stretched.lifetimeSavings)}` : `costs ${formatCurrency(-stretched.lifetimeSavings)} more`}
    and is ahead ${aheadText(stretched).toLowerCase()}. At ${formatPercent(stretchedHigher.input.newRate)} over ${formatDuration(stretchedHigher.input.newTermMonths)}, the payment
    drops by ${formatCurrency(stretchedHigher.monthlySavings)} a month, yet the refinance is ${aheadText(stretchedHigher).toLowerCase()} and costs
    ${formatCurrency(-stretchedHigher.lifetimeSavings)} more in total.</p>
  </section>

  <section class="content-section" aria-labelledby="sell-heading">
    <h2 id="sell-heading">If you sell or trade in the car early</h2>
    <p>Most people sell or trade in a car before the loan ends, so the calculator compares both options at each point: payments made so far, plus the balance you would
    still have to pay off from the sale, plus fees paid in cash. A longer new term leaves a larger balance, which matters if the car is worth less than you owe.
    Our <a href="/calculators/auto-loan-calculator/">auto loan calculator</a> shows how negative equity rolls into a new loan.</p>
  </section>

  <section class="content-section" aria-labelledby="costs-heading">
    <h2 id="costs-heading">Fees and prepayment penalties</h2>
    <p>Refinancing can involve lender fees and state title or registration fees. Some contracts also charge a penalty for paying the loan off early; your Truth in
    Lending disclosure says whether one applies (<a href="${SOURCES.prepayment.url}">CFPB: prepayment penalties</a>). Adding ${formatCurrency(financed.refinance.costs)} of fees
    and penalty to the example loan instead of paying them in cash raises the new payment to ${formatCurrency(financed.refinance.payment)}, with total savings of
    ${formatCurrency(financed.lifetimeSavings)} and a true break-even ${aheadText(financed).toLowerCase()}.</p>
  </section>

  <section class="content-section" aria-labelledby="auto-refi-how-heading">
    <h2 id="auto-refi-how-heading">How the comparison is calculated</h2>
    <ol>
      <li>Each loan's payment is the fixed-rate payment <code>P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</code>, where r is the annual rate ÷ 12 and n is
      the number of months: the same formula as our <a href="/calculators/loan-payment-calculator/">loan payment calculator</a>.</li>
      <li>The new loan starts from the payoff amount, plus fees and penalty if you add them to the loan.</li>
      <li>Both loans are amortized month by month. For every month, each option's cost is payments made so far + balance still owed + costs paid in cash.</li>
      <li>Refinancing is ahead in any month where its cost is lower. The same method powers our
      <a href="/calculators/mortgage-refinance-calculator/">mortgage refinance calculator</a>.</li>
    </ol>
    <p>Amounts are calculated at full precision and rounded to cents only for display.</p>
  </section>

  <section class="content-section" aria-labelledby="auto-refi-assumptions-heading">
    <h2 id="auto-refi-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Insurance, taxes, GAP coverage, extended warranties and other add-on products, and any refund of them when the old loan closes.</li>
      <li>Cash-out refinancing, changes in the car's value and the costs of selling it.</li>
      <li>Rates stay fixed, with monthly payments and interest at the annual rate ÷ 12. Lenders may calculate interest daily, so their figures can differ slightly.</li>
      <li>No rates are assumed for any lender. Enter the rate and costs from your own offer. Results are estimates, not a loan offer or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="auto-refi-method-heading">
    <h2 id="auto-refi-method-heading">Methodology and testing</h2>
    <p>Both loans use the same tested amortization engine as every loan calculator on this site. Automated tests check the payments, total savings and true
    break-even against an independent month-by-month simulation for 300 random offers, including longer terms, financed costs and prepayment penalties.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.compareAutoLoans, SOURCES.prepayment])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/auto-loan-refinance.js']
  };
}

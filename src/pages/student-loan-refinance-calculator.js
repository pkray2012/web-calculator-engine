/**
 * Student Loan Refinance Calculator page. Example results and every worked
 * figure in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { studentLoanRefinanceForm } from '../components/student-loan-refinance-form.js';
import { studentLoanRefinanceResults, studentLoanRefinanceQuickResult } from '../components/student-loan-refinance-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { SLR_DEFAULTS, parseSlrForm, buildSlrView } from '../adapters/student-loan-refinance.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildSlrView(parseSlrForm({ ...SLR_DEFAULTS, ...overrides }).input);
}

export function studentLoanRefinancePage() {
  const calculator = findCalculator('student-loan-refinance-calculator');
  const example = exampleView();
  const { input } = example;
  const stretched = exampleView({ newTermValue: '20' });
  const withFee = exampleView({ newRate: '6.4', fees: '700' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Compare keeping your student loans with a private refinance offer. See the new payment, the total you save or lose after fees, what a longer
  term really costs, and, for federal loans, what you would give up. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your loans and the offer',
    form: studentLoanRefinanceForm(SLR_DEFAULTS, {}, studentLoanRefinanceQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.balance)} of federal loans at ${formatPercent(input.currentRate)} with ${formatDuration(input.currentTermMonths)} left, refinanced to ${formatPercent(input.newRate)} for ${formatDuration(input.newTermMonths)} (illustrative rates). Enter your numbers to update.`,
    results: studentLoanRefinanceResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="federal-heading">
    <h2 id="federal-heading">Federal loans: what refinancing gives up</h2>
    <p>Refinancing replaces your loans with a new private loan. For federal student loans that is permanent: the new loan does not keep the federal loans'
    benefits and protections, and it cannot be turned back into a federal loan (<a href="${SOURCES.studentLoanRefinance.url}">CFPB: consolidating or refinancing
    student loans</a>). Those protections include federal repayment plans tied to income, forgiveness programs and federal options to pause payments.
    A lower rate can still be worth it, especially if your income is secure and you do not expect to use them, but the calculator cannot put a price on them.</p>
    <p>Before refinancing federal loans, compare your federal repayment options with the official <a href="${SOURCES.loanSimulator.url}">Loan Simulator</a>.
    Rules for federal plans change, so check the current options there rather than relying on older articles.</p>
  </section>

  <section class="content-section" aria-labelledby="rate-heading">
    <h2 id="rate-heading">Separate the rate from the term</h2>
    <p>Refinancing ${formatCurrency(input.balance)} from ${formatPercent(input.currentRate)} to ${formatPercent(input.newRate)} over the same
    ${formatDuration(input.newTermMonths)} lowers the payment by ${formatCurrency(example.monthlySavings)} and saves ${formatCurrency(example.lifetimeSavings)} in total.
    Take the same rate over ${formatDuration(stretched.input.newTermMonths)} and the payment falls to ${formatCurrency(stretched.refinance.payment)}, but you would pay
    ${formatCurrency(-stretched.lifetimeSavings)} more in total, because interest runs for ${formatDuration(stretched.extraMonths)} longer. The results always show the
    new rate over the time you already have left, so you can see what the rate alone is worth.</p>
  </section>

  <section class="content-section" aria-labelledby="fees-heading">
    <h2 id="fees-heading">Fees and small rate cuts</h2>
    <p>Check whether the offer charges a fee. A ${formatCurrency(withFee.input.fees)} fee on a cut from ${formatPercent(withFee.input.currentRate)} to
    ${formatPercent(withFee.input.newRate)} leaves ${withFee.lifetimeSavings >= 0 ? `a total saving of ${formatCurrency(withFee.lifetimeSavings)}` : `you ${formatCurrency(-withFee.lifetimeSavings)} worse off`}
    on the example loan. If you combine student loans with other debt in one loan, the new loan may no longer qualify for the student loan interest tax deduction
    (<a href="${SOURCES.studentLoanRefinance.url}">CFPB</a>).</p>
  </section>

  <section class="content-section" aria-labelledby="slr-how-heading">
    <h2 id="slr-how-heading">How the comparison is calculated</h2>
    <ol>
      <li>Each payment is the fixed-rate payment <code>P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</code>, where r is the annual rate ÷ 12 and n is the
      number of months: the same formula as our <a href="/calculators/loan-payment-calculator/">loan payment calculator</a>.</li>
      <li>Your current loans are treated as one fixed-rate loan with the balance, rate and time left you enter. For several loans, use the total balance and the
      balance-weighted average rate.</li>
      <li>Total cost is every payment until payoff, plus any fee. Total savings is the difference between the two.</li>
    </ol>
    <p>Amounts are calculated at full precision and rounded to cents only for display.</p>
  </section>

  <section class="content-section" aria-labelledby="slr-assumptions-heading">
    <h2 id="slr-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Federal repayment plans based on income, forgiveness, deferment and forbearance. Use the Loan Simulator for those.</li>
      <li>Variable rates: an offer with a variable rate can cost more than shown if rates rise.</li>
      <li>Interest that builds up during deferment or grace periods, autopay discounts and tax effects.</li>
      <li>Whether you qualify. Private lenders set their own credit and income requirements. Results are estimates, not a loan offer or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="slr-method-heading">
    <h2 id="slr-method-heading">Methodology and testing</h2>
    <p>Both options use the same tested amortization engine as every loan calculator on this site. Automated tests check the payments, total interest and total
    savings against an independent month-by-month simulation for 300 random loans and offers, including longer terms and fees.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.studentLoanRefinance, SOURCES.loanSimulator])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/student-loan-refinance.js']
  };
}

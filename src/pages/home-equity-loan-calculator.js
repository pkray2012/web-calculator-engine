/**
 * Home Equity Loan Calculator page. Example results and every worked figure in
 * the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { homeEquityLoanForm } from '../components/home-equity-loan-form.js';
import { homeEquityLoanResults, homeEquityQuickResult } from '../components/home-equity-loan-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { HEL_DEFAULTS, parseHelForm, buildHelView } from '../adapters/home-equity-loan.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildHelView(parseHelForm({ ...HEL_DEFAULTS, ...overrides }).input);
}

export function homeEquityLoanPage() {
  const calculator = findCalculator('home-equity-loan-calculator');
  const example = exampleView();
  const { home } = example;
  const [cap80, cap85, cap90] = home.limits;
  const financed = exampleView({ financeClosingCosts: 'on' });
  const tenYears = exampleView({ termValue: '10' });
  const thirtyYears = exampleView({ termValue: '30' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Estimate the monthly payment on a fixed-rate home equity loan, how much you might be able to borrow against your home at common lender
  limits, and how much cash you actually receive after closing costs. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your home and the loan',
    form: homeEquityLoanForm(HEL_DEFAULTS, {}, homeEquityQuickResult(example)),
    exampleNote: `Example: a ${formatCurrency(home.value)} home with ${formatCurrency(home.existingDebt)} left on the mortgage, borrowing ${formatCurrency(home.loanAmount)} at ${formatPercent(example.input.annualRate)} for ${formatDuration(example.input.termMonths)} with ${formatCurrency(home.closingCosts)} closing costs (illustrative rate). Enter your numbers to update.`,
    results: homeEquityLoanResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="what-heading">
    <h2 id="what-heading">What a home equity loan is</h2>
    <p>A home equity loan lets you borrow against the equity in your home, the part of its value you own outright. You receive the money as a lump sum and repay it
    in fixed monthly payments, usually at a fixed rate. Your home is the collateral, so if you cannot repay, the lender could foreclose
    (<a href="${SOURCES.homeEquityLoanBasics.url}">CFPB: what is a home equity loan?</a>).</p>
  </section>

  <section class="content-section" aria-labelledby="cltv-heading">
    <h2 id="cltv-heading">How much you can borrow: combined loan-to-value</h2>
    <p>Lenders cap the total of all loans secured by the home, your mortgage plus the new loan, at a percentage of its value. This is the combined loan-to-value
    ratio (CLTV). The largest new loan is <code>home value × CLTV limit − what you already owe</code>.</p>
    <p>For the example home worth ${formatCurrency(home.value)} with ${formatCurrency(home.existingDebt)} owed, an ${cap80.cltvPercent}% limit allows
    ${formatCurrency(cap80.maxTotalDebt)} of total debt, so the largest new loan is ${formatCurrency(cap80.capacity)}. At ${cap85.cltvPercent}% it is
    ${formatCurrency(cap85.capacity)}, and at ${cap90.cltvPercent}% it is ${formatCurrency(cap90.capacity)}. The limit varies by lender, and your income, debts,
    credit and the appraised value also decide what you are offered, so treat these figures as a ceiling, not an approval.</p>
  </section>

  <section class="content-section" aria-labelledby="costs-heading">
    <h2 id="costs-heading">Closing costs: deducted or added to the loan</h2>
    <p>If ${formatCurrency(home.closingCosts)} of closing costs comes out of the loan, you receive ${formatCurrency(home.cashReceived)} and repay
    ${formatCurrency(example.input.principal)} at ${formatCurrency(example.monthlyPayment)} a month. Adding the costs to the loan instead gives you the full
    ${formatCurrency(financed.home.cashReceived)}, but you repay ${formatCurrency(financed.input.principal)} at ${formatCurrency(financed.monthlyPayment)} a month,
    and the total cost of borrowing rises from ${formatCurrency(home.costOfBorrowing)} to ${formatCurrency(financed.home.costOfBorrowing)}. Your
    <a href="${SOURCES.loanEstimate.url}">Loan Estimate</a> lists the expected closing costs.</p>
  </section>

  <section class="content-section" aria-labelledby="term-heading">
    <h2 id="term-heading">Choosing a term</h2>
    <p>The same ${formatCurrency(home.loanAmount)} at ${formatPercent(example.input.annualRate)} costs ${formatCurrency(tenYears.monthlyPayment)} a month over
    ${formatDuration(tenYears.input.termMonths)} with ${formatCurrency(tenYears.totalInterest)} of interest, or ${formatCurrency(thirtyYears.monthlyPayment)} a month over
    ${formatDuration(thirtyYears.input.termMonths)} with ${formatCurrency(thirtyYears.totalInterest)} of interest. The results compare common terms side by side.</p>
  </section>

  <section class="content-section" aria-labelledby="vs-heloc-heading">
    <h2 id="vs-heloc-heading">Home equity loan or HELOC?</h2>
    <p>A home equity loan pays out once, with a fixed payment. A home equity line of credit (HELOC) lets you draw as you need, and its payment usually changes with
    the balance and a variable rate (<a href="${SOURCES.helocVsHomeEquityLoan.url}">CFPB: home equity loan vs. HELOC</a>). A loan suits a known, one-time cost;
    a line suits costs that arrive over time.</p>
  </section>

  <section class="content-section" aria-labelledby="hel-how-heading">
    <h2 id="hel-how-heading">How the payment is calculated</h2>
    <p>The payment is the fixed-rate payment <code>P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</code>, where P is the amount you repay (the loan plus any
    closing costs added to it), r is the annual rate ÷ 12 and n is the number of months: the same formula as our
    <a href="/calculators/loan-payment-calculator/">loan payment calculator</a>. The schedule applies each payment to interest first, then principal.
    Amounts are calculated at full precision and rounded to cents only for display.</p>
  </section>

  <section class="content-section" aria-labelledby="hel-assumptions-heading">
    <h2 id="hel-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Whether you qualify: lenders also look at income, other debts, credit history and an appraisal.</li>
      <li>Property taxes, homeowners insurance and any change to your first mortgage.</li>
      <li>Tax deductibility of the interest. Ask a tax professional.</li>
      <li>Variable-rate loans and lines of credit. The rate stays fixed, with monthly interest at the annual rate ÷ 12.</li>
      <li>No rates or CLTV limits are assumed for any lender. Results are estimates, not a loan offer or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="hel-method-heading">
    <h2 id="hel-method-heading">Methodology and testing</h2>
    <p>The payment and schedule come from the same tested amortization engine as every loan calculator on this site. Automated tests check the payment, total
    interest, CLTV and borrowing limits against independent calculations for 300 random homes and loans, including financed closing costs and other liens.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.homeEquityLoanBasics, SOURCES.helocVsHomeEquityLoan, SOURCES.loanEstimate])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/home-equity-loan.js']
  };
}

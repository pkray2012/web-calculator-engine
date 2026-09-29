/**
 * Loan Payment Calculator page. The form and pre-rendered example results use
 * the same adapter and components that the browser uses for live updates.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent } from '../lib/format.js';
import { loanForm } from '../components/loan-form.js';
import { loanResults, loanQuickResult } from '../components/loan-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { LOAN_DEFAULTS, parseLoanForm, buildLoanView } from '../adapters/loan-payment.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';
import { amortizationSchedule } from '../calculators/loan-payment.js';

export function loanPaymentPage() {
  const calculator = findCalculator('loan-payment-calculator');
  const example = buildLoanView(parseLoanForm(LOAN_DEFAULTS).input);
  const { principal, annualRate, termMonths } = example.input;
  const monthlyRate = annualRate / 100 / 12;
  const [firstRow] = amortizationSchedule({ principal, annualRate, termMonths });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Find the monthly payment on a fixed-rate loan, what it will cost in total interest,
  and how a different term or extra payments would change that. Every figure comes with a full amortization schedule.
  It works for any fixed-rate loan repaid in equal monthly payments, such as a car, personal, student or home loan;
  for a mortgage it covers principal and interest only.</p>
</header>

${calculatorShell({
  inputsHeading: 'Loan details',
  form: loanForm(LOAN_DEFAULTS, {}, loanQuickResult(example)),
  exampleNote: `Example: ${formatCurrency(principal)} at ${formatPercent(annualRate)} for ${termMonths / 12} years. Enter your loan details to update.`,
  results: loanResults(example)
})}

<article class="content">
  <section class="content-section" aria-labelledby="how-heading">
    <h2 id="how-heading">How the monthly payment is calculated</h2>
    <p>For a fixed-rate loan repaid in equal monthly installments, the payment is:</p>
    <p class="formula"><code>Payment = P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</code></p>
    <ul>
      <li><strong>P</strong> is the amount borrowed.</li>
      <li><strong>r</strong> is the monthly interest rate: the annual rate ÷ 100 ÷ 12.</li>
      <li><strong>n</strong> is the number of monthly payments.</li>
    </ul>
    <p>At a 0% rate the payment is simply P ÷ n.</p>
    <p><strong>Worked example:</strong> borrowing ${formatCurrency(principal)} at ${formatPercent(annualRate)} for ${termMonths} months
    gives r = ${monthlyRate.toFixed(6)} and a payment of <strong>${formatCurrency(example.monthlyPayment)}</strong>.
    Over ${termMonths} payments you repay ${formatCurrency(example.totalRepayment)}, of which ${formatCurrency(example.totalInterest)} is interest.</p>
  </section>

  <section class="content-section" aria-labelledby="interest-heading">
    <h2 id="interest-heading">Why early payments are mostly interest</h2>
    <p>Each month, interest is charged on the balance you still owe: balance × r. The rest of the payment reduces the balance.
    In the example, the first payment of ${formatCurrency(firstRow.payment)} is ${formatCurrency(firstRow.interest)} interest and
    ${formatCurrency(firstRow.principal)} principal. As the balance falls, the interest share shrinks and more of each payment goes to principal.
    The amortization schedule above shows this month by month.</p>
  </section>

  <section class="content-section" aria-labelledby="term-heading">
    <h2 id="term-heading">How the loan term changes what you pay</h2>
    <p>Stretching the same loan over more months lowers the payment, but interest is charged for longer, so total interest rises.
    The term comparison above uses your amount and rate so you can see that trade-off directly before choosing a term.</p>
  </section>

  <section class="content-section" aria-labelledby="extra-payments-heading">
    <h2 id="extra-payments-heading">How extra payments are modeled</h2>
    <p>The extra amount is added to every monthly payment from the first one and applied entirely to principal.
    The required payment stays the same, so the loan finishes early and the final payment is smaller.
    Some lenders apply extra money to future payments instead, so ask your servicer to apply it to principal.
    Whether you can pay early without a penalty depends on your contract and state law, and your Truth in Lending disclosure
    says whether a prepayment penalty applies (<a href="${SOURCES.prepayment.url}">CFPB: prepaying a loan</a>).</p>
  </section>

  <section class="content-section" aria-labelledby="assumptions-heading">
    <h2 id="assumptions-heading">Assumptions and limitations</h2>
    <ul>
      <li>Fixed interest rate for the whole term, with 12 equal monthly payments per year.</li>
      <li>Monthly interest is the annual rate divided by 12, applied to the remaining balance.</li>
      <li>Origination fees, taxes, insurance, late fees and other lender charges are not included. For a loan with an origination fee, use the
      <a href="/calculators/personal-loan-calculator/">personal loan calculator</a>; for a car with sales tax, fees and a trade-in, use the
      <a href="/calculators/auto-loan-calculator/">auto loan calculator</a>.</li>
      <li>An APR includes fees as well as interest, so it is usually higher than the interest rate
      (<a href="${SOURCES.aprVsRate.url}">CFPB: interest rate vs. APR</a>). Entering an APR gives an approximate payment; the exact payment depends on the
      interest rate and the amount financed on your loan documents.</li>
      <li>Amounts are calculated at full precision and rounded to cents only for display, so a lender's figures may differ by a few cents. The final payment is adjusted to the remaining balance.</li>
      <li>Results are estimates, not a loan offer, approval or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="method-heading">
    <h2 id="method-heading">Methodology and testing</h2>
    <p>The calculator uses a standalone, tested calculation engine that is kept separate from this page.
    Automated tests check it against known results, for example a $300,000 loan at 6.5% for 30 years has a
    payment of $1,896.20. They also check that every schedule pays the balance to zero and that principal plus
    interest equals each payment. Your inputs are processed in your browser and are not sent to a server.
    <a href="/about/">Read how we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.aprVsRate, SOURCES.prepayment])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/loan-payment.js']
  };
}

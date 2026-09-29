/**
 * Mortgage Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { mortgagePaymentForm } from '../components/mortgage-payment-form.js';
import { mortgagePaymentResults, mortgageQuickResult } from '../components/mortgage-payment-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { MORTGAGE_DEFAULTS, parseMortgageForm, buildMortgageView } from '../adapters/mortgage-payment.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildMortgageView(parseMortgageForm({ ...MORTGAGE_DEFAULTS, ...overrides }).input);
}

export function mortgagePaymentPage() {
  const calculator = findCalculator('mortgage-calculator');
  const example = exampleView();
  const { input } = example;
  const twenty = exampleView({ downPaymentValue: '20' });
  const fifteen = exampleView({ termValue: '15' });
  const pctDown = formatPercent(example.downPaymentPercent, 0);

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Estimate your full monthly mortgage payment: principal and interest plus property tax, homeowners insurance, private mortgage insurance (PMI)
  and HOA dues. See when PMI can come off and what the loan costs in total. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your home and loan',
    form: mortgagePaymentForm(MORTGAGE_DEFAULTS, {}, mortgageQuickResult(example)),
    exampleNote: `Example: a ${formatCurrency(input.homePrice)} home with ${pctDown} down at ${formatPercent(input.annualRate)} for ${formatDuration(input.termMonths)}, ${formatCurrency(input.propertyTaxYearly)} a year of property tax, ${formatCurrency(input.insuranceYearly)} of insurance and ${formatPercent(input.pmiRate)} PMI (illustrative figures, not local rates). Enter your numbers to update.`,
    results: mortgagePaymentResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="parts-heading">
    <h2 id="parts-heading">What makes up a mortgage payment</h2>
    <ul>
      <li><strong>Principal and interest:</strong> the fixed-rate loan payment. In the example it is ${formatCurrency(example.monthly.principalAndInterest)} of the
      ${formatCurrency(example.totalMonthly)} total.</li>
      <li><strong>Property tax and homeowners insurance:</strong> often collected with the payment and held in an escrow account, then paid when due. Both usually
      change over time.</li>
      <li><strong>PMI:</strong> private mortgage insurance, which a conventional loan may require with less than 20% down. It protects the lender, not you
      (<a href="${SOURCES.pmiBasics.url}">CFPB: what is PMI?</a>).</li>
      <li><strong>HOA dues:</strong> paid to a homeowners association, usually directly rather than through the lender.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="pmi-heading">
    <h2 id="pmi-heading">When PMI comes off</h2>
    <p>You can ask your lender to cancel PMI once your balance is scheduled to reach 80% of the home's original value, and your servicer must end it
    automatically when the balance is scheduled to reach 78%, as long as you are current on payments. "Original value" generally means the lower of the
    purchase price and the appraised value (<a href="${SOURCES.pmiRemoval.url}">CFPB: removing PMI</a>).</p>
    <p>For the example loan, 80% is scheduled after ${example.pmi.canRequestMonth} payments and 78% after ${example.pmi.autoEndMonth}, so PMI costs about
    ${formatCurrency(example.pmi.total)} in total. With 20% down there is no PMI: the payment is ${formatCurrency(twenty.totalMonthly)} instead of
    ${formatCurrency(example.totalMonthly)}, but you need ${formatCurrency(twenty.downPayment - example.downPayment)} more in cash up front.
    Extra principal payments can reach the 80% point sooner; our <a href="/calculators/loan-payoff-calculator/">loan payoff calculator</a> shows how much faster.</p>
  </section>

  <section class="content-section" aria-labelledby="term-heading">
    <h2 id="term-heading">15 or 30 years</h2>
    <p>Over ${formatDuration(fifteen.input.termMonths)} at the same ${formatPercent(input.annualRate)}, the example loan's principal and interest is
    ${formatCurrency(fifteen.monthly.principalAndInterest)} a month instead of ${formatCurrency(example.monthly.principalAndInterest)}, and total interest falls from
    ${formatCurrency(example.totalInterest)} to ${formatCurrency(fifteen.totalInterest)}. Shorter loans often come with lower rates too, which this comparison
    does not assume.</p>
  </section>

  <section class="content-section" aria-labelledby="mortgage-how-heading">
    <h2 id="mortgage-how-heading">How the payment is calculated</h2>
    <ol>
      <li>Loan amount = home price − down payment.</li>
      <li>Principal and interest = <code>P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</code>, where r is the annual rate ÷ 12 and n is the number of
      months: the same formula as our <a href="/calculators/loan-payment-calculator/">loan payment calculator</a>.</li>
      <li>Property tax and insurance are your yearly amounts ÷ 12. PMI is the yearly rate × the loan amount ÷ 12, only when the loan is more than 80% of the price.</li>
      <li>The PMI dates come from the scheduled balance: the first payment after which it is at or below 80%, then 78%, of the home price.</li>
    </ol>
    <p>Amounts are calculated at full precision and rounded to cents only for display.</p>
  </section>

  <section class="content-section" aria-labelledby="mortgage-assumptions-heading">
    <h2 id="mortgage-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Closing costs, discount points and prepaid items. Your <a href="${SOURCES.loanEstimate.url}">Loan Estimate</a> lists them.</li>
      <li>FHA, VA and USDA loans, whose mortgage insurance or fees follow different rules.</li>
      <li>Adjustable rates. The rate stays fixed, with interest at the annual rate ÷ 12.</li>
      <li>Changes to taxes, insurance or dues over time, and whether you qualify. Results are estimates, not a loan offer or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="mortgage-method-heading">
    <h2 id="mortgage-method-heading">Methodology and testing</h2>
    <p>Principal and interest come from the same tested amortization engine as every loan calculator on this site. Automated tests check the payment, the
    80% and 78% PMI months and the total cost against independent closed-form calculations for 300 random loans.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.pmiBasics, SOURCES.pmiRemoval, SOURCES.loanEstimate])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/mortgage-payment.js']
  };
}

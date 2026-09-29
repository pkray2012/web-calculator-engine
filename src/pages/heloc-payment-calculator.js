/**
 * HELOC Payment Calculator page. Example results and every worked figure in
 * the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration, formatPercent } from '../lib/format.js';
import { helocForm } from '../components/heloc-form.js';
import { helocResults, helocQuickResult } from '../components/heloc-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { HELOC_DEFAULTS, parseHelocForm, buildHelocView } from '../adapters/heloc.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildHelocView(parseHelocForm({ ...HELOC_DEFAULTS, ...overrides }).input);
}

export function helocPaymentPage() {
  const calculator = findCalculator('heloc-payment-calculator');
  const example = exampleView();
  const { input } = example;
  const principalAndInterest = exampleView({ drawPayment: 'principalAndInterest' });
  const plusTwo = example.scenarios.find((row) => row.points === 2);

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Estimate your home equity line of credit (HELOC) payment now, what it becomes when the draw period ends and repayment starts,
  and how much a higher rate would add. For homeowners with a HELOC or considering one. Principal and interest only; your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your HELOC',
    form: helocForm(HELOC_DEFAULTS, {}, helocQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.balance)} drawn at ${formatPercent(input.rate)}, ${formatDuration(input.drawMonths)} draw period with interest-only payments, then ${formatDuration(input.repaymentMonths)} of repayment (illustrative rate). Enter your numbers to update.`,
    results: helocResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="heloc-how-heading">
    <h2 id="heloc-how-heading">How HELOC payments work</h2>
    <p>A HELOC is a line of credit secured by your home. It usually has a <strong>draw period</strong>, when you can borrow and often pay only interest,
    followed by a <strong>repayment period</strong>, when you can no longer borrow and pay back principal and interest. Most HELOCs have a variable rate
    (<a href="${SOURCES.helocBasics.url}">CFPB: what is a HELOC?</a>).</p>
    <dl class="definitions">
      <dt>Interest-only draw payment</dt>
      <dd>Balance × annual rate ÷ 12. In the example: ${formatCurrency(input.balance)} × ${formatPercent(input.rate)} ÷ 12 = <strong>${formatCurrency(example.drawPayment)}</strong> a month. The balance does not go down.</dd>
      <dt>Repayment payment</dt>
      <dd>The balance left at the end of the draw period, repaid in equal monthly payments over the repayment period:
      <code>B × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</code>, with r = annual rate ÷ 12 and n = repayment months.
      In the example: <strong>${formatCurrency(example.repaymentPayment)}</strong> a month for ${formatDuration(input.repaymentMonths)}.</dd>
      <dt>Payment shock</dt>
      <dd>The jump from the draw payment to the repayment payment: here ${formatCurrency(example.paymentShock)}, or ${formatPercent(example.paymentShockPercent, 0)} more each month from month ${example.repaymentStartMonth}.</dd>
    </dl>
  </section>

  <section class="content-section" aria-labelledby="heloc-pi-heading">
    <h2 id="heloc-pi-heading">Interest-only vs. principal-and-interest draw payments</h2>
    <p>Paying only interest keeps the draw-period payment low, but the whole balance is still owed when repayment starts. Paying principal and interest from the start
    (spread over the draw and repayment periods together) costs ${formatCurrency(principalAndInterest.drawPayment)} a month in the example, and the payment then stays the same.
    Total interest falls from ${formatCurrency(example.totalInterest)} to ${formatCurrency(principalAndInterest.totalInterest)}.</p>
  </section>

  <section class="content-section" aria-labelledby="heloc-rate-heading">
    <h2 id="heloc-rate-heading">When the rate changes</h2>
    <p>Because HELOC rates usually move with an index, the payment can change even within a phase. The rate table above re-runs the same balance and periods at your rate plus
    1, 2 and 3 percentage points. In the example, at ${formatPercent(plusTwo.annualRate)} the repayment payment would be ${formatCurrency(plusTwo.repaymentPayment)}.
    These are what-if figures, not forecasts. Your agreement sets how the rate is calculated and any caps.</p>
  </section>

  <section class="content-section" aria-labelledby="heloc-vs-heading">
    <h2 id="heloc-vs-heading">HELOC or home equity loan?</h2>
    <p>A home equity loan pays out a lump sum with a fixed payment; a HELOC lets you draw as needed, and its payment depends on the balance and rate
    (<a href="${SOURCES.helocVsHomeEquityLoan.url}">CFPB: home equity loan vs. HELOC</a>). For a fixed amount at a fixed rate, the
    <a href="/calculators/loan-payment-calculator/">loan payment calculator</a> gives the payment and full schedule.</p>
  </section>

  <section class="content-section" aria-labelledby="heloc-assumptions-heading">
    <h2 id="heloc-assumptions-heading">Assumptions and limitations</h2>
    <ul>
      <li>The rate stays the same for the whole estimate. Real HELOC rates are usually variable; use the rate table for what-if cases.</li>
      <li>The balance is drawn in full at the start, with no further draws or extra payments.</li>
      <li>Interest is the annual rate ÷ 12 on the balance each month. Your lender may calculate interest daily.</li>
      <li>Fees are not included. HELOCs can carry application, appraisal, closing, annual or other fees
      (<a href="${SOURCES.helocFees.url}">CFPB: HELOC fees</a>).</li>
      <li>Minimum-payment rules, rate floors and caps, and balloon payments in some agreements are not modelled.</li>
      <li>This does not estimate how much you can borrow. Results are estimates, not a loan offer or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="heloc-method-heading">
    <h2 id="heloc-method-heading">Methodology and testing</h2>
    <p>The HELOC engine uses the same tested amortization engine as every loan calculator on this site. Automated tests check the draw and repayment payments,
    payment shock and total interest against independent closed-form calculations, including zero rates, short periods and principal-and-interest draw payments.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.helocBasics, SOURCES.helocVsHomeEquityLoan, SOURCES.helocFees])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/heloc.js']
  };
}

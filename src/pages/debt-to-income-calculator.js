/**
 * Debt-to-Income Ratio Calculator page. Example results and every worked
 * figure in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent } from '../lib/format.js';
import { dtiForm } from '../components/dti-form.js';
import { dtiResults, dtiQuickResult } from '../components/dti-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { DTI_DEFAULTS, parseDtiForm, buildDtiView } from '../adapters/debt-to-income.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildDtiView(parseDtiForm({ ...DTI_DEFAULTS, ...overrides }).input);
}

export function debtToIncomePage() {
  const calculator = findCalculator('debt-to-income-calculator');
  const example = exampleView();
  const { input } = example;
  // The CFPB's own worked example, computed with the same engine.
  const cfpb = exampleView({ incomeValue: '6000', incomeUnit: 'month', housingPayment: '1500', autoPayment: '100', studentPayment: '', cardPayment: '400' });
  const noCar = exampleView({ autoPayment: '' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out your debt-to-income ratio from your gross income and monthly debt payments. See your housing and total ratios, what each
  payment adds, and how much room you have, or how much to cut, to reach a target. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your income and debts',
    form: dtiForm(DTI_DEFAULTS, {}, dtiQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.income)} a year of gross income, a ${formatCurrency(input.housingPayment)} housing payment and ${formatCurrency(example.otherTotal)} a month of other debt payments (illustrative figures). Enter your numbers to update.`,
    results: dtiResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="dti-what-heading">
    <h2 id="dti-what-heading">What debt-to-income measures</h2>
    <p>Your debt-to-income ratio is all your monthly debt payments divided by your gross monthly income, before taxes and deductions. Lenders use it to
    judge whether you can manage the payments on money you borrow (<a href="${SOURCES.debtToIncome.url}">CFPB: what is a debt-to-income ratio?</a>).
    In the CFPB's example, ${formatCurrency(cfpb.totalDebt)} of payments on ${formatCurrency(cfpb.grossMonthlyIncome)} of income is
    ${formatPercent(cfpb.backEndPercent, 0)}, which this calculator reproduces.</p>
  </section>

  <section class="content-section" aria-labelledby="dti-two-heading">
    <h2 id="dti-two-heading">Housing ratio and total ratio</h2>
    <ul>
      <li><strong>Housing (front-end) ratio:</strong> the housing payment alone. In the example it is ${formatPercent(example.frontEndPercent, 1)}.</li>
      <li><strong>Total (back-end) ratio:</strong> housing plus every other debt payment: ${formatPercent(example.backEndPercent, 1)} in the example.</li>
    </ul>
    <p>Guidelines such as 28% and 36% are rules of thumb, not law, and lenders set their own limits. Our
    <a href="/calculators/home-affordability-calculator/">home affordability calculator</a> turns these limits into a home price.</p>
  </section>

  <section class="content-section" aria-labelledby="dti-lower-heading">
    <h2 id="dti-lower-heading">Lowering your ratio</h2>
    <p>The ratio falls when payments go down or income goes up. Paying off the example's ${formatCurrency(input.debts[0].amount)} car payment would take the total
    ratio from ${formatPercent(example.backEndPercent, 1)} to ${formatPercent(noCar.backEndPercent, 1)}. Our
    <a href="/calculators/loan-payoff-calculator/">loan payoff calculator</a> shows how extra payments shorten a loan. Only the required monthly payment
    counts, so for credit cards use the minimum due, not the balance.</p>
  </section>

  <section class="content-section" aria-labelledby="dti-assumptions-heading">
    <h2 id="dti-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Everyday bills such as utilities, groceries and insurance premiums, which are not debt payments.</li>
      <li>Lender-specific rules for counting income (for example variable or self-employment income) or for estimating payments on deferred loans.</li>
    </ul>
    <p>Results are estimates, not a loan decision or financial advice.</p>
  </section>

  <section class="content-section" aria-labelledby="dti-method-heading">
    <h2 id="dti-method-heading">Methodology and testing</h2>
    <p>Ratios are payments ÷ gross monthly income × 100; yearly income is divided by 12. If you are paid by the hour, the
    <a href="/calculators/hourly-to-salary-calculator/">Hourly to Salary Calculator</a> converts your wage to monthly income. Automated tests reproduce the CFPB's worked example and check
    that the payment reduction shown brings the ratio exactly to your target. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.debtToIncome])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/debt-to-income.js']
  };
}

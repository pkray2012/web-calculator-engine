/**
 * Home Affordability Calculator page. Example results and every worked figure
 * in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../lib/format.js';
import { affordabilityForm } from '../components/affordability-form.js';
import { affordabilityResults, affordabilityQuickResult } from '../components/affordability-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { AFFORDABILITY_DEFAULTS, parseAffordabilityForm, buildAffordabilityView } from '../adapters/mortgage-affordability.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildAffordabilityView(parseAffordabilityForm({ ...AFFORDABILITY_DEFAULTS, ...overrides }).input);
}

export function homeAffordabilityPage() {
  const calculator = findCalculator('home-affordability-calculator');
  const example = exampleView();
  const { input } = example;
  const heavyDebt = exampleView({ monthlyDebt: '1200' });
  const higherLimit = exampleView({ backEndRatio: '43', frontEndRatio: '36' });
  const moreDown = exampleView({ downPayment: '80000' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Estimate how much house you can afford from your income, monthly debts and down payment. See which debt-to-income limit sets your
  budget, what the monthly payment would include and how the price changes with the rate. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your income, debts and loan',
    form: affordabilityForm(AFFORDABILITY_DEFAULTS, {}, affordabilityQuickResult(example)),
    exampleNote: `Example: ${formatCurrencyWhole(input.annualIncome)} a year of income, ${formatCurrency(input.monthlyDebt)} a month of other debt payments and ${formatCurrencyWhole(input.downPayment)} down at ${formatPercent(input.annualRate)} for ${input.termYears} years, with ${formatPercent(input.propertyTaxRate)} property tax, ${formatCurrencyWhole(input.insuranceYearly)} a year of insurance and ${formatPercent(input.pmiRate)} PMI (illustrative figures, not local rates). Enter your numbers to update.`,
    results: affordabilityResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="dti-heading">
    <h2 id="dti-heading">How debt-to-income limits set the budget</h2>
    <p>Debt-to-income (DTI) is your monthly debt payments divided by your gross monthly income; lenders use it to judge whether you can manage the payments
    (<a href="${SOURCES.debtToIncome.url}">CFPB: what is a debt-to-income ratio?</a>). This calculator applies two limits you choose:</p>
    <ul>
      <li><strong>Housing limit (front-end):</strong> the full housing payment (principal, interest, property tax, insurance, PMI and HOA dues) as a share of
      income. In the example, ${formatPercent(input.frontEndRatio, 0)} of ${formatCurrency(example.grossMonthlyIncome)} a month is
      ${formatCurrency(example.frontEndCap)}.</li>
      <li><strong>Total debt limit (back-end):</strong> the housing payment plus your other debt payments. ${formatPercent(input.backEndRatio, 0)} of income,
      minus ${formatCurrency(input.monthlyDebt)} of other debts, leaves ${formatCurrency(example.backEndCap)}.</li>
    </ul>
    <p>The smaller of the two is your housing budget, and the calculator finds the highest price whose full payment fits it. The common 28% and 36% figures
    are rules of thumb, not law: lenders set their own limits and may approve higher ratios, and a limit a lender allows is not the same as a payment that
    is comfortable for you.</p>
  </section>

  <section class="content-section" aria-labelledby="debts-heading">
    <h2 id="debts-heading">When other debts cost you house</h2>
    <p>With ${formatCurrency(input.monthlyDebt)} of other debt payments, the example is limited by the ${example.binding === 'front' ? 'housing' : 'total debt'}
    limit and could afford about ${formatCurrencyWhole(example.maxHomePrice)}. At ${formatCurrency(heavyDebt.input.monthlyDebt)} a month, the total debt limit
    takes over and the price falls to about ${formatCurrencyWhole(heavyDebt.maxHomePrice)}${heavyDebt.withoutDebt ? `; paying those debts off would restore about ${formatCurrencyWhole(heavyDebt.withoutDebt.maxHomePrice - heavyDebt.maxHomePrice)} of buying power` : ''}.
    Our <a href="/calculators/loan-payoff-calculator/">loan payoff calculator</a> shows how extra payments shorten a loan.</p>
  </section>

  <section class="content-section" aria-labelledby="levers-heading">
    <h2 id="levers-heading">What moves the number</h2>
    <ul>
      <li><strong>Rate:</strong> the results table shows the example price at one point lower and higher: from
      ${formatCurrencyWhole(example.rateScenarios[0].maxHomePrice)} to ${formatCurrencyWhole(example.rateScenarios[example.rateScenarios.length - 1].maxHomePrice)}.</li>
      <li><strong>Down payment:</strong> ${formatCurrencyWhole(moreDown.input.downPayment)} down instead of ${formatCurrencyWhole(input.downPayment)} raises the price
      to about ${formatCurrencyWhole(moreDown.maxHomePrice)}${moreDown.pmi === 0 && example.pmi > 0 ? ', partly because 20% down removes PMI' : ''}.</li>
      <li><strong>Limits:</strong> at 36% housing and 43% total debt, the example price is about ${formatCurrencyWhole(higherLimit.maxHomePrice)}, with a
      ${formatCurrency(higherLimit.monthlyHousingCost)} monthly payment instead of ${formatCurrency(example.monthlyHousingCost)}.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="afford-how-heading">
    <h2 id="afford-how-heading">How the price is calculated</h2>
    <ol>
      <li>Housing budget = the smaller of (income ÷ 12 × housing limit) and (income ÷ 12 × total debt limit − other debt payments).</li>
      <li>For a candidate price: loan = price − down payment; principal and interest use the standard payment formula, the same as our
      <a href="/calculators/mortgage-calculator/">mortgage calculator</a>; property tax = price × tax rate ÷ 12; insurance = yearly amount ÷ 12; PMI = loan ×
      PMI rate ÷ 12, only when the loan is more than 80% of the price.</li>
      <li>The calculator searches for the highest price whose total monthly payment is within the budget, to within a fraction of a cent.</li>
    </ol>
  </section>

  <section class="content-section" aria-labelledby="afford-assumptions-heading">
    <h2 id="afford-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Closing costs and cash reserves. Keep them on top of the down payment; your <a href="${SOURCES.loanEstimate.url}">Loan Estimate</a> lists closing costs.</li>
      <li>FHA, VA and USDA loans, whose mortgage insurance, fees and limits follow different rules.</li>
      <li>Credit scores, loan limits, underwriting rules and changes in taxes or insurance. Results are estimates, not a pre-approval, loan offer or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="afford-method-heading">
    <h2 id="afford-method-heading">Methodology and testing</h2>
    <p>Automated tests compare the calculator with an independent implementation: for 200 varied cases the solved price's payment fits the budget and one
    dollar more does not, and worked examples match separately computed reference prices. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.debtToIncome, SOURCES.pmiBasics, SOURCES.loanEstimate])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/mortgage-affordability.js']
  };
}

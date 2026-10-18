/**
 * Rental Property Calculator page (draft: registry status "planned", not
 * built into the site until reviewed). Example results and every worked figure
 * are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { rentalForm } from '../components/rental-property-form.js';
import { rentalResults, rentalQuickResult } from '../components/rental-property-results.js';
import { relatedLinks } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { RENTAL_DEFAULTS, parseRentalForm, buildRentalView } from '../adapters/rental-property.js';
import { calculateRentalProperty } from '../calculators/rental-property.js';
import { findCalculator, relatedCalculators } from '../content/site.js';

const RENT_STEPS = [-0.1, -0.05, 0, 0.05, 0.1];
const VACANCY_STEPS = [0, 5, 10];

const pct = (ratio, digits = 2) => `${(ratio * 100).toFixed(digits)}%`;
const signed = (value) => (value < -0.005 ? `−${formatCurrency(-value)}` : formatCurrency(value));

export function rentalPropertyPage() {
  const calculator = findCalculator('rental-property-calculator');
  const example = buildRentalView(parseRentalForm(RENTAL_DEFAULTS).input);
  const { input, result: r } = example;
  const allCash = calculateRentalProperty({ ...input, downPaymentPercent: 100 });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">See whether a rental property pays for itself: first-year cash flow, cash-on-cash return, cap rate, DSCR and the rent you need to
  break even, with every cost shown line by line. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your rental',
    form: rentalForm(RENTAL_DEFAULTS, {}, rentalQuickResult(example)),
    exampleNote: `Example: a ${formatCurrency(input.purchasePrice)} property renting for ${formatCurrency(input.monthlyRent)} a month, with ${input.downPaymentPercent}% down at
    ${input.interestRate}%. All example figures are illustrative, not market data. Enter your own numbers to update.`,
    results: rentalResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="rp-noi-heading">
    <h2 id="rp-noi-heading">Net operating income comes first</h2>
    <p>Net operating income (NOI) is what the property earns before any loan: rent you actually collect, minus the costs of running it. In the example,
    ${formatCurrency(r.grossScheduledIncome)} of scheduled rent less ${input.vacancyPercent}% vacancy leaves ${formatCurrency(r.effectiveGrossIncome)} collected;
    operating costs of ${formatCurrency(r.operatingExpenses)} leave an NOI of ${formatCurrency(r.netOperatingIncome)}.</p>
    <p>Loan payments are left out of NOI on purpose, so that two buyers with different financing can compare the same property. Depreciation and income
    tax are left out too.</p>
    <p class="formula"><code>NOI = (rent + other income) × 12 × (1 − vacancy) − operating costs</code></p>
  </section>

  <section class="content-section" aria-labelledby="rp-cap-heading">
    <h2 id="rp-cap-heading">Cap rate</h2>
    <p>Cap rate is NOI divided by the price: ${formatCurrency(r.netOperatingIncome)} ÷ ${formatCurrency(r.purchasePrice)} = ${pct(r.capRate)}. It describes the
    property as if bought for cash, so it does not change with the loan. Buying the example property for cash gives the same cap rate but a different
    cash-on-cash return: ${pct(allCash.cashOnCash)} instead of ${pct(r.cashOnCash)}.</p>
  </section>

  <section class="content-section" aria-labelledby="rp-coc-heading">
    <h2 id="rp-coc-heading">Cash flow and cash-on-cash return</h2>
    <p>Cash flow is NOI minus the loan payments: ${formatCurrency(r.netOperatingIncome)} − ${formatCurrency(r.annualDebtService)} = ${signed(r.annualCashFlow)} a year.
    Cash-on-cash return divides it by the cash you put in, here ${formatCurrency(r.cashInvested)} for the down payment, closing costs and upfront
    repairs: ${pct(r.cashOnCash)}.</p>
    <p>A negative first-year cash flow${r.annualCashFlow < 0 ? ', as in this example,' : ''} means you would add money each month to keep the property. The calculator shows the
    first year only; it does not include rent increases, the loan balance you pay down or any change in the property's value, so it is not a total return.</p>
  </section>

  <section class="content-section" aria-labelledby="rp-dscr-heading">
    <h2 id="rp-dscr-heading">Debt service coverage ratio (DSCR)</h2>
    <p>DSCR is NOI divided by a year of loan payments. Below 1.00 the property's income does not cover its loan payments; the example's
    ${r.dscr.toFixed(2)} ${r.dscr < 1 ? 'falls short' : 'covers them'}. Lenders that underwrite investment loans on DSCR set their own minimums and their own ways of estimating income
    and costs, so a lender's figure can differ from this one.</p>
  </section>

  <section class="content-section" aria-labelledby="rp-sens-heading">
    <h2 id="rp-sens-heading">How rent and vacancy change monthly cash flow</h2>
    ${dataTable({
      id: 'rp-sensitivity',
      title: 'Monthly cash flow for the example property by rent and vacancy',
      columns: [{ key: 'rent', label: 'Monthly rent' }, ...VACANCY_STEPS.map((v) => ({ key: `v${v}`, label: `${v}% vacancy`, numeric: true }))],
      rows: RENT_STEPS.map((step) => {
        const rent = input.monthlyRent * (1 + step);
        return {
          rent: formatCurrency(rent),
          ...Object.fromEntries(VACANCY_STEPS.map((v) => [`v${v}`, signed(calculateRentalProperty({ ...input, monthlyRent: rent, vacancyPercent: v }).monthlyCashFlow)]))
        };
      })
    })}
    <p>Break-even rent is the monthly rent at which first-year cash flow is zero: about ${formatCurrency(r.breakEvenRent)} in the example.</p>
  </section>

  <section class="content-section" aria-labelledby="rp-assumptions-heading">
    <h2 id="rp-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>First year only: no rent growth, cost increases, appreciation, loan paydown or sale.</li>
      <li>Vacancy applies to rent and other income alike. Maintenance, capital reserve and management are percentages of all income actually
      collected, so they fall when units are vacant.</li>
      <li>The loan is a fixed-rate, fully amortizing loan. Mortgage insurance, points and interest-only or adjustable loans are not modeled.</li>
      <li>Income tax, depreciation and the tax treatment of rental losses are not included. They can change your after-tax return substantially.</li>
      <li>Results are estimates from your inputs, not investment advice or a lender's underwriting.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="rp-method-heading">
    <h2 id="rp-method-heading">Methodology and testing</h2>
    <p>The loan payment uses the same tested engine as our loan and mortgage calculators. Automated tests check a hand-worked example, that cash flow is
    exactly zero at the break-even rent, that financing changes cash flow but not NOI or cap rate, all-cash purchases, and 1,000 random deals against an
    independent reference. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/rental-property.js']
  };
}

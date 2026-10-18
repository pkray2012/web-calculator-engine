/**
 * Rent Affordability Calculator page (draft: registry status "planned", not
 * built into the site until reviewed and its source is verified directly).
 * Example results and every worked figure are computed from the engine at
 * build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency as formatRounded } from '../lib/format.js';
import { rentAffordabilityForm } from '../components/rent-affordability-form.js';
import { rentAffordabilityResults, rentAffordabilityQuickResult } from '../components/rent-affordability-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { RENT_AFFORD_DEFAULTS, parseRentAffordabilityForm, buildRentAffordabilityView } from '../adapters/rent-affordability.js';
import { calculateRentAffordability } from '../calculators/rent-affordability.js';
import { roundCents } from '../calculators/sales-tax.js';
import { findCalculator, relatedCalculators } from '../content/site.js';

const formatCurrency = (value) => formatRounded(roundCents(value));
const INCOMES = [30000, 40000, 50000, 60000, 75000, 100000, 125000, 150000];

/**
 * Pending direct verification: HUD's definitions were confirmed only through
 * search-result excerpts of this page (2026-10-18). Move to
 * src/content/sources.js once the page has been read directly.
 */
export const RENT_AFFORD_SOURCES = Object.freeze({
  hudCostBurden: {
    title: 'CHAS: Background',
    publisher: 'U.S. Department of Housing and Urban Development, HUD USER',
    url: 'https://www.huduser.gov/portal/datasets/cp/CHAS/bg_chas.html',
    supports: 'Cost burden is monthly housing costs, including utilities, exceeding 30% of monthly income; severe cost burden is housing costs, including utilities, exceeding 50% of monthly income.'
  }
});

export function rentAffordabilityPage() {
  const calculator = findCalculator('rent-affordability-calculator');
  const example = buildRentAffordabilityView(parseRentAffordabilityForm(RENT_AFFORD_DEFAULTS).input);
  const { input, result: r } = example;

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">See how much rent you can afford three ways: the 30% of income rule, the income a landlord is likely to ask for, and what your own
  monthly budget leaves room for. Then check a specific rent against all three. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your income and budget',
    form: rentAffordabilityForm(RENT_AFFORD_DEFAULTS, {}, rentAffordabilityQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.annualGrossIncome)} a year before taxes, ${formatCurrency(input.monthlyTakeHome)} a month take-home, and ${formatCurrency(input.monthlyUtilities)} of utilities. Illustrative figures; enter your own to update.`,
    results: rentAffordabilityResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="ra-30-heading">
    <h2 id="ra-30-heading">The 30% rule</h2>
    <p>One guideline is to keep housing costs at or below 30% of income. The U.S. Department of Housing and Urban Development counts
    housing costs including utilities, and calls households paying more than 30% of monthly income cost-burdened and more than 50% severely
    cost-burdened. This calculator applies the share to income before taxes. In the example, ${input.housingSharePercent}% of ${formatCurrency(r.grossMonthly)} a month is
    ${formatCurrency(r.guidelineHousingCost)}; after ${formatCurrency(r.monthlyUtilities)} of utilities, that leaves ${formatCurrency(r.guidelineRent)} for rent.</p>
    <p>It is a rule of thumb, not a budget. On a high income 30% can be more than you need to spend; on a low income it can leave too little for
    everything else, which is why the budget view below matters.</p>
  </section>

  <section class="content-section" aria-labelledby="ra-40-heading">
    <h2 id="ra-40-heading">The landlord income screen</h2>
    <p>Some landlords ask for yearly income of a set multiple of the monthly rent, such as 40 times. Divide your income by the multiple to find the
    highest rent you would qualify for: ${formatCurrency(r.annualGrossIncome)} ÷ ${input.incomeMultiple} = ${formatCurrency(r.screenRent)}. With no utilities, a
    40× screen and the 30% rule give the same answer, because 12 months ÷ 40 is 30%. Landlords set their own screening rules, so ask before you
    apply.</p>
  </section>

  ${r.budget ? html`<section class="content-section" aria-labelledby="ra-budget-heading">
    <h2 id="ra-budget-heading">What your budget leaves</h2>
    <p>The budget view starts from take-home pay: ${formatCurrency(input.monthlyTakeHome)} − ${formatCurrency(input.monthlyDebts)} debts − ${formatCurrency(input.monthlyEssentials)}
    essentials − ${formatCurrency(input.monthlySavings)} savings = ${formatCurrency(r.budget.leftForHousing)} for housing, or ${formatCurrency(r.budget.rent)} for rent after
    utilities. If that is lower than the 30% figure, your budget is the real limit.</p>
  </section>` : ''}

  <section class="content-section" aria-labelledby="ra-table-heading">
    <h2 id="ra-table-heading">Rent at 30% of income by salary (no utilities included)</h2>
    ${dataTable({
      id: 'ra-table',
      title: 'Monthly rent at 30% of gross income',
      columns: [{ key: 'income', label: 'Yearly income' }, { key: 'rent', label: 'Rent at 30%', numeric: true }, { key: 'severe', label: 'Rent at 50%', numeric: true }],
      rows: INCOMES.map((income) => {
        const row = calculateRentAffordability({ annualGrossIncome: income });
        return { income: formatCurrency(income), rent: formatCurrency(row.guidelineRent), severe: formatCurrency(row.severeRent) };
      })
    })}
  </section>

  <section class="content-section" aria-labelledby="ra-assumptions-heading">
    <h2 id="ra-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Income is gross (before taxes) for the 30% rule and the landlord screen, and take-home for the budget view.</li>
      <li>Renters insurance, parking, fees and deposits are not included unless you add them to utilities or essentials.</li>
      <li>Landlords decide their own screening rules.</li>
      <li>Maximum rents are rounded down to the cent, so each one passes its own test.</li>
      <li>This is a planning estimate, not financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="ra-method-heading">
    <h2 id="ra-method-heading">Methodology and testing</h2>
    <p>Rent at the income share = share × gross monthly income − utilities; rent under the screen = yearly income ÷ multiple; budget rent = take-home −
    debts − essentials − savings − utilities. None goes below zero. Automated tests check hand-worked examples, that 30% and 40× agree without
    utilities, the 30% and 50% band edges, zero income and budgets with nothing left. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection(Object.values(RENT_AFFORD_SOURCES))}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/rent-affordability.js']
  };
}

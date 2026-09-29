/**
 * Dividend Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrencyWhole } from '../lib/format.js';
import { dividendForm } from '../components/dividend-form.js';
import { dividendResults, dividendQuickResult } from '../components/dividend-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { DIVIDEND_DEFAULTS, parseDividendForm, buildDividendView } from '../adapters/dividend.js';
import { projectDividends, investmentForIncome } from '../calculators/dividend.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildDividendView(parseDividendForm({ ...DIVIDEND_DEFAULTS, ...overrides }).input);
}

export function dividendPage() {
  const calculator = findCalculator('dividend-calculator');
  const example = exampleView();
  const { input } = example;
  const simple = projectDividends({ initialInvestment: 10_000, dividendYield: 4, years: 10, frequency: 4 });
  const cash = projectDividends({ initialInvestment: 10_000, dividendYield: 4, years: 10, frequency: 4, reinvest: false });
  const forThousand = investmentForIncome({ annualIncome: 12_000, dividendYield: 4 });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Project the dividend income and value of a stock or fund, with or without reinvesting dividends (a DRIP), monthly contributions,
  dividend and price growth, and tax. See how much you would need invested for a target income. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your investment',
    form: dividendForm(DIVIDEND_DEFAULTS, {}, dividendQuickResult(example)),
    exampleNote: `Example: $${Number(input.initialInvestment).toLocaleString('en-US')} plus $${input.monthlyContribution} a month for ${input.years} years at a ${input.dividendYield}% yield, paid quarterly and reinvested, with ${input.dividendGrowth}% dividend growth, ${input.priceGrowth}% price growth and ${input.taxRate}% tax on dividends. These are illustrative, not forecasts.`,
    results: dividendResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="div-yield-heading">
    <h2 id="div-yield-heading">Dividend yield and dividend income</h2>
    <p>Dividend yield is the annual dividend per share divided by the share price
    (<a href="${SOURCES.investorDividendYield.url}">Investor.gov: dividend yield</a>). A $50 share paying $2 a year yields 4%. Your annual income is
    roughly the amount invested × the yield: $10,000 at 4% pays about $400 a year, or $100 a quarter.</p>
    <p class="formula"><code>Annual dividend income = shares × annual dividend per share = amount invested × dividend yield</code></p>
    <p>To earn $12,000 a year at a 4% yield before tax, you would need about ${formatCurrencyWhole(forThousand)} invested (income ÷ yield). Enter a target
    income above to work this out at your own yield.</p>
  </section>

  <section class="content-section" aria-labelledby="div-drip-heading">
    <h2 id="div-drip-heading">Reinvesting dividends (DRIP)</h2>
    <p>A dividend reinvestment plan uses each dividend to buy more shares, which then earn dividends of their own
    (<a href="${SOURCES.investorDrip.url}">Investor.gov: dividend reinvestment plans</a>). With no price or dividend growth, $10,000 at 4% paid
    quarterly grows to ${formatCurrencyWhole(simple.endingValue)} in 10 years if reinvested, against ${formatCurrencyWhole(cash.endingValue)} (the same $10,000 plus
    ${formatCurrencyWhole(cash.cash)} in cash) if the dividends are taken. Reinvesting pays about ${formatCurrencyWhole(simple.nextYearIncome)} a year by the end,
    against ${formatCurrencyWhole(cash.nextYearIncome)}.</p>
  </section>

  <section class="content-section" aria-labelledby="div-growth-heading">
    <h2 id="div-growth-heading">Dividend growth and yield on cost</h2>
    <p>Many companies raise their dividend over time, and others cut it. With dividend growth, the income from the same shares rises each year, so the
    yield on what you originally paid (yield on cost) climbs above the starting yield. In the example, next year's income is
    ${example.yieldOnCost.toFixed(2)}% of the ${formatCurrencyWhole(example.contributed)} put in, against a starting yield of ${input.dividendYield}%. Treat any growth
    rate as an assumption, not a promise.</p>
  </section>

  <section class="content-section" aria-labelledby="div-tax-heading">
    <h2 id="div-tax-heading">Taxes on dividends</h2>
    <p>In a taxable account, dividends are taxable in the year they are paid, even if you reinvest them. Qualified dividends are taxed at the lower
    capital gains rates, while ordinary dividends are taxed as ordinary income (<a href="${SOURCES.irsDividends.url}">IRS Topic 404: dividends</a>). Enter
    the rate you expect on your dividends, or 0 for an IRA, 401(k) or other tax-advantaged account. The example's
    ${formatCurrencyWhole(example.totalDividends)} of dividends includes ${formatCurrencyWhole(example.totalTaxes)} of tax at ${input.taxRate}%.</p>
  </section>

  <section class="content-section" aria-labelledby="div-assumptions-heading">
    <h2 id="div-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Yield, dividend growth, price growth and tax rate stay constant. In reality all of them change, and dividends can be reduced or suspended.</li>
      <li>The dividend per share is set once a year and paid in equal installments; price growth is compounded monthly.</li>
      <li>Reinvested dividends buy shares at that month's price, with no fees and fractional shares allowed. Dividends taken as cash earn no interest.</li>
      <li>Monthly contributions buy shares at the start of each month. Taxes are taken from each payout at the rate you enter.</li>
      <li>This is an illustration, not investment advice or a forecast of any particular stock or fund.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="div-method-heading">
    <h2 id="div-method-heading">Methodology and testing</h2>
    <p>The projection runs month by month: contributions buy shares, the price grows, and on each payout month the dividend (shares × annual dividend per
    share ÷ payouts a year), less tax, is reinvested or kept as cash. Automated tests check that reinvested dividends with no growth match compound
    interest exactly (10,000 × 1.04¹⁰ for annual payouts), that cash payouts, dividend growth and price growth each match their closed-form results, and
    a combined case against an independent month-by-month simulation. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.investorDividendYield, SOURCES.investorDrip, SOURCES.irsDividends])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/dividend.js']
  };
}

/**
 * Rent vs. Buy Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../lib/format.js';
import { rentVsBuyForm } from '../components/rent-vs-buy-form.js';
import { rentVsBuyResults, rentVsBuyQuickResult } from '../components/rent-vs-buy-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { RVB_DEFAULTS, parseRentVsBuyForm, buildRentVsBuyView } from '../adapters/rent-vs-buy.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildRentVsBuyView(parseRentVsBuyForm({ ...RVB_DEFAULTS, ...overrides }).input);
}

const gapText = (view) => `${view.buyingWins ? 'buying' : 'renting'} ahead by about ${formatCurrencyWhole(Math.abs(view.advantage))}`;

export function rentVsBuyPage() {
  const calculator = findCalculator('rent-vs-buy-calculator');
  const example = exampleView();
  const { input } = example;
  const twenty = exampleView({ years: '20' });
  const higherRent = exampleView({ monthlyRent: '3000' });
  const higherReturn = exampleView({ investmentReturnPercent: '7' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Compare renting with buying a similar home over the years you expect to stay. See your net worth on each path year by year,
  the break-even year for buying, and every assumption behind it. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your home, rent and assumptions',
    form: rentVsBuyForm(RVB_DEFAULTS, {}, rentVsBuyQuickResult(example)),
    exampleNote: `Example: a ${formatCurrencyWhole(input.homePrice)} home with ${formatPercent(input.downPaymentPercent, 0)} down at ${formatPercent(input.annualRate)}, or ${formatCurrencyWhole(input.monthlyRent)} a month in rent, over ${input.years} years with ${formatPercent(input.appreciationPercent)} price growth, ${formatPercent(input.rentIncreasePercent)} rent increases and a ${formatPercent(input.investmentReturnPercent)} return (illustrative assumptions, not forecasts). Enter your numbers to update.`,
    results: rentVsBuyResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="compare-how-heading">
    <h2 id="compare-how-heading">How the comparison works</h2>
    <p>The calculator follows both paths month by month and compares what you would own if you sold at the end of each year:</p>
    <ul>
      <li><strong>Buying:</strong> the home's value, minus the loan balance and selling costs, plus anything the buyer invested in months when owning
      cost less than renting.</li>
      <li><strong>Renting:</strong> the down payment and closing costs, invested instead, plus the difference in any month when owning costs more
      than renting.</li>
    </ul>
    <p>Because both paths spend the same cash, the comparison is about what that cash builds, not just the monthly payment. In the example the first
    month costs ${formatCurrency(example.firstMonth.buyCost)} to own and ${formatCurrency(example.firstMonth.rentCost)} to rent.</p>
  </section>

  <section class="content-section" aria-labelledby="time-heading">
    <h2 id="time-heading">Why time matters most</h2>
    <p>Buying has large one-off costs: closing costs going in and selling costs coming out. They take years of equity growth to recover. Over
    ${input.years} years the example ends with ${gapText(example)}; over ${twenty.input.years} years it ends with ${gapText(twenty)}${twenty.breakevenYear ? `, breaking even in year ${twenty.breakevenYear}` : ''}.
    If you may move within a few years, renting often costs less overall.</p>
  </section>

  <section class="content-section" aria-labelledby="assumptions-matter-heading">
    <h2 id="assumptions-matter-heading">The assumptions that swing the answer</h2>
    <ul>
      <li><strong>Rent:</strong> at ${formatCurrencyWhole(higherRent.input.monthlyRent)} a month instead of ${formatCurrencyWhole(input.monthlyRent)}, the example ends
      with ${gapText(higherRent)}${higherRent.breakevenYear ? ` and breaks even in year ${higherRent.breakevenYear}` : ''}.</li>
      <li><strong>Investment return:</strong> at ${formatPercent(higherReturn.input.investmentReturnPercent)} instead of ${formatPercent(input.investmentReturnPercent)},
      it ends with ${gapText(higherReturn)}. Returns are not guaranteed and can be negative.</li>
      <li><strong>Home prices:</strong> growth is an assumption, not a forecast. Prices can fall, and a small change compounds over many years.</li>
    </ul>
    <p>Owning also carries risks and responsibilities a landlord usually carries for renters, such as repairs and rising taxes and insurance, while renting
    keeps you flexible (<a href="${SOURCES.rentOrBuy.url}">CFPB: is it the right time to buy?</a>).</p>
  </section>

  <section class="content-section" aria-labelledby="rvb-assumptions-heading">
    <h2 id="rvb-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Income taxes: the mortgage interest deduction, capital gains exclusions and taxes on investment returns.</li>
      <li>Changes in the mortgage rate (it is a fixed-rate loan), insurance or HOA dues over time, and utility differences.</li>
      <li>Security deposits, moving costs and the value of stability or flexibility.</li>
    </ul>
    <p>Up-front and ongoing costs of buying are explained by the CFPB (<a href="${SOURCES.costsOfBuying.url}">what are all the costs of buying a home?</a>).
    Results are estimates based on your assumptions, not financial advice.</p>
  </section>

  <section class="content-section" aria-labelledby="rvb-method-heading">
    <h2 id="rvb-method-heading">Methodology and testing</h2>
    <p>The mortgage payment and PMI come from the same tested engine as our <a href="/calculators/mortgage-calculator/">mortgage calculator</a>. Automated
    tests compare every year's net worth on both paths with an independent month-by-month simulation, and check that both paths account for the same
    cash. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.rentOrBuy, SOURCES.costsOfBuying, SOURCES.pmiBasics])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/rent-vs-buy.js']
  };
}

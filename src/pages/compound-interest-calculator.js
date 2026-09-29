/**
 * Compound Interest Calculator page. Example results and every worked figure
 * in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../lib/format.js';
import { compoundForm } from '../components/compound-form.js';
import { compoundResults, compoundQuickResult } from '../components/compound-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { COMPOUND_DEFAULTS, parseCompoundForm, buildCompoundView } from '../adapters/compound-interest.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildCompoundView(parseCompoundForm({ ...COMPOUND_DEFAULTS, ...overrides }).input);
}

export function compoundInterestPage() {
  const calculator = findCalculator('compound-interest-calculator');
  const example = exampleView();
  const { input } = example;
  const lump = exampleView({ monthlyContribution: '0' });
  const inflation = exampleView({ inflationPercent: '3' });
  const start = exampleView({ contributionTiming: 'start' });
  const frequencies = ['annually', 'quarterly', 'monthly', 'daily', 'continuously'].map((compounding) => ({ compounding, view: exampleView({ compounding, monthlyContribution: '0' }) }));
  const label = { annually: 'Annually', quarterly: 'Quarterly', monthly: 'Monthly', daily: 'Daily', continuously: 'Continuously' };

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">See how a deposit and regular monthly contributions grow with compound interest: the future value, how much is interest, how
  much compounding adds compared with simple interest, the value in today's dollars, and how long money takes to double. Your inputs stay in your
  browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your savings or investment',
    form: compoundForm(COMPOUND_DEFAULTS, {}, compoundQuickResult(example)),
    exampleNote: `Example: ${formatCurrencyWhole(input.initialDeposit)} to start plus ${formatCurrencyWhole(input.monthlyContribution)} a month at ${formatPercent(input.ratePercent)} compounded monthly for ${input.years} years (illustrative; actual returns vary). Enter your numbers to update.`,
    results: compoundResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="ci-formula-heading">
    <h2 id="ci-formula-heading">Compound interest formula</h2>
    <p>Compound interest is interest earned on both your deposits and the interest already added. For a single deposit P at an annual rate r
    compounded n times a year for t years:</p>
    <p><code>A = P × (1 + r/n)<sup>n × t</sup></code></p>
    <p>At the example rate, ${formatCurrencyWhole(lump.input.initialDeposit)} left alone for ${lump.input.years} years grows to ${formatCurrency(lump.futureValue)}.
    With continuous compounding the formula becomes A = P × e<sup>r × t</sup>.</p>
    <p>With a monthly contribution D, the calculator grows the balance month by month: each month the balance is multiplied by
    g = (1 + r/n)<sup>n/12</sup> and the contribution is added. Over N months that sums to
    <code>A = P × g<sup>N</sup> + D × (g<sup>N</sup> − 1) ÷ (g − 1)</code>. Adding ${formatCurrencyWhole(input.monthlyContribution)} a month takes the example
    to ${formatCurrency(example.futureValue)}; adding it at the start of each month instead gives ${formatCurrency(start.futureValue)}, because each
    deposit earns one more month of interest.</p>
  </section>

  <section class="content-section" aria-labelledby="ci-frequency-heading">
    <h2 id="ci-frequency-heading">How often interest compounds</h2>
    <p>More frequent compounding adds interest to the balance sooner, so it earns slightly more. The difference is small next to the rate itself.
    The annual percentage yield (APY) expresses any compounding as a single yearly rate
    (<a href="${SOURCES.apyDefinition.url}">Truth in Savings definition</a>), so to use an account's APY, enter it as the rate and choose "Annually".</p>
    ${dataTable({
      id: 'ci-frequencies',
      title: `${formatCurrencyWhole(lump.input.initialDeposit)} at ${formatPercent(lump.input.ratePercent)} for ${lump.input.years} years`,
      columns: [{ key: 'how', label: 'Compounding' }, { key: 'apy', label: 'APY', numeric: true }, { key: 'value', label: 'Final balance', numeric: true }],
      rows: frequencies.map(({ compounding, view }) => ({ how: label[compounding], apy: formatPercent(view.apy * 100, 3), value: formatCurrency(view.futureValue) }))
    })}
  </section>

  <section class="content-section" aria-labelledby="ci-simple-heading">
    <h2 id="ci-simple-heading">Simple versus compound interest</h2>
    <p>With simple interest, interest is paid only on the money deposited and never on earlier interest. For the example, simple interest would
    give ${formatCurrency(example.simpleInterestValue)}; compounding adds ${formatCurrency(example.compoundingBonus)} more. The gap grows with time, because
    interest keeps earning interest.</p>
  </section>

  <section class="content-section" aria-labelledby="ci-double-heading">
    <h2 id="ci-double-heading">How long to double your money: the rule of 72</h2>
    <p>Divide 72 by the annual rate in percent to estimate how many years a lump sum takes to double. At ${formatPercent(input.ratePercent)} that is
    ${example.ruleOf72Years.toFixed(1)} years; the exact figure with monthly compounding is ln 2 ÷ ln(1 + APY) = ${example.doublingYears.toFixed(1)} years.
    The rule is a quick estimate that works best for rates between about 4% and 12%.</p>
  </section>

  <section class="content-section" aria-labelledby="ci-inflation-heading">
    <h2 id="ci-inflation-heading">Inflation and real growth</h2>
    <p>Prices also rise over time, so a future balance buys less than the same amount today. Entering an inflation rate divides the result by
    (1 + inflation)<sup>years</sup>: at 3% inflation, the example's ${formatCurrencyWhole(inflation.futureValue)} is worth about
    ${formatCurrencyWhole(inflation.realValue)} in today's dollars.</p>
  </section>

  <section class="content-section" aria-labelledby="ci-assumptions-heading">
    <h2 id="ci-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>The rate is fixed for the whole period. Savings rates change, and investment returns vary from year to year and can be negative; a
      steady rate is a simplification, not a forecast.</li>
      <li>Contributions are the same every month, and nothing is withdrawn.</li>
      <li>Taxes, fees and account minimums are not included.</li>
    </ul>
    <p>Results are estimates for planning, not financial advice.</p>
  </section>

  <section class="content-section" aria-labelledby="ci-method-heading">
    <h2 id="ci-method-heading">Methodology and testing</h2>
    <p>Automated tests compare future values for monthly, daily, quarterly and continuous compounding, start- and end-of-month contributions,
    simple interest and inflation with an independent closed-form calculation done to 40 significant digits.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.apyDefinition])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/compound-interest.js']
  };
}

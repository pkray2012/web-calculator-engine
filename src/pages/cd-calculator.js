/**
 * CD Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { cdForm } from '../components/cd-form.js';
import { cdResults, cdQuickResult } from '../components/cd-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { CD_DEFAULTS, parseCdForm, buildCdView } from '../adapters/certificate-of-deposit.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildCdView(parseCdForm({ ...CD_DEFAULTS, ...overrides }).input);
}

const pct = (fraction, digits = 3) => formatPercent(fraction * 100, digits);

export function cdPage() {
  const calculator = findCalculator('cd-calculator');
  const example = exampleView();
  const { input } = example;
  const aprDaily = exampleView({ rateType: 'apr' });
  const earlyOk = exampleView({ withdrawMonth: '12', penaltyMonths: '6' });
  const earlyLoss = exampleView({ withdrawMonth: '2', penaltyMonths: '6' });
  const taxed = exampleView({ taxPercent: '22' });
  const threeMonth = exampleView({ termValue: '3' });
  const fiveYear = exampleView({ termValue: '5', termUnit: 'years' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Calculate how much a certificate of deposit (CD) will be worth when it matures, the interest it earns before and after tax, and
  what you would get back if you cashed it in early and paid the penalty. Enter the APY a bank advertises, or an interest rate and how often it
  compounds. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your CD',
    form: cdForm(CD_DEFAULTS, {}, cdQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.deposit)} in a ${formatDuration(input.termMonths)} CD at ${formatPercent(input.ratePercent)} APY (illustrative, not a current rate). Enter your numbers to update.`,
    results: cdResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="cd-how-heading">
    <h2 id="cd-how-heading">How CD interest is calculated</h2>
    <p>A CD pays a fixed rate for a fixed term, and you generally agree to leave the money in until it matures
    (<a href="${SOURCES.cdBasics.url}">CFPB: what is a CD</a>). The calculator estimates the value at maturity with compound interest:</p>
    <ul>
      <li><strong>From the APY:</strong> value = deposit × (1 + APY)<sup>months ÷ 12</sup>. APY is the total interest over a year including
      compounding (<a href="${SOURCES.apyDefinition.url}">Truth in Savings definition</a>), so ${formatCurrency(input.deposit)} at ${formatPercent(input.ratePercent)} APY for
      ${formatDuration(input.termMonths)} grows to ${formatCurrency(example.maturityValue)}, earning ${formatCurrency(example.interest)}.</li>
      <li><strong>From an interest rate:</strong> APY = (1 + rate ÷ n)<sup>n</sup> − 1, where n is the number of times interest compounds each year
      (365 for daily, 12 for monthly). A ${formatPercent(input.ratePercent)} rate compounded daily is a ${pct(aprDaily.apy)} APY, and the same CD would earn
      ${formatCurrency(aprDaily.interest)}.</li>
    </ul>
    <p>Terms follow the same formula: a ${formatDuration(threeMonth.input.termMonths)} CD at the example rate earns ${formatCurrency(threeMonth.interest)}, and a
    ${formatDuration(fiveYear.input.termMonths)} CD earns ${formatCurrency(fiveYear.interest)}, because interest also earns interest over the longer term.</p>
  </section>

  <section class="content-section" aria-labelledby="cd-apy-heading">
    <h2 id="cd-apy-heading">APY, interest rate and compounding</h2>
    <p>Two CDs with the same interest rate can pay different amounts if one compounds more often. APY puts them on the same footing, which is why
    banks must disclose it. When comparing CD offers, compare APYs; choose "interest rate" in the calculator only when you have a rate and a
    compounding frequency rather than an APY. The table in the results shows the same rate compounded daily, monthly, quarterly and annually.</p>
  </section>

  <section class="content-section" aria-labelledby="cd-early-how-heading">
    <h2 id="cd-early-how-heading">Early withdrawal: is it worth breaking a CD?</h2>
    <p>Withdrawing before maturity usually costs a penalty stated as months of interest, for example 3 months' interest on a 1-year CD. The
    calculator treats the penalty as that many months of simple interest on the deposit at the CD's interest rate. For the example CD with a
    6-month penalty:</p>
    <ul>
      <li>Cashing in after ${formatDuration(earlyOk.earlyWithdrawal.month)} returns ${formatCurrency(earlyOk.earlyWithdrawal.received)}, a gain of
      ${formatCurrency(earlyOk.earlyWithdrawal.gain)} after the ${formatCurrency(earlyOk.earlyWithdrawal.penalty)} penalty.</li>
      <li>Cashing in after ${formatDuration(earlyLoss.earlyWithdrawal.month)} returns ${formatCurrency(earlyLoss.earlyWithdrawal.received)}: the penalty is more than
      the interest earned, so you get back less than you deposited.</li>
    </ul>
    <p>Before breaking a CD to move money to a higher rate, compare the extra interest you would earn with the penalty. Penalty rules vary by bank
    and are in the account disclosure; some banks calculate them on the amount withdrawn or in days of interest.</p>
  </section>

  <section class="content-section" aria-labelledby="cd-tax-heading">
    <h2 id="cd-tax-heading">Taxes on CD interest</h2>
    <p>CD interest is generally taxable as ordinary income. Entering your combined federal and state rate shows what you keep: at a 22% rate, the
    example's ${formatCurrency(taxed.interest)} of interest leaves ${formatCurrency(taxed.afterTaxInterest)} after tax. CDs held in a retirement
    account are taxed differently. A tax professional can confirm how it applies to you.</p>
  </section>

  <section class="content-section" aria-labelledby="cd-assumptions-heading">
    <h2 id="cd-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Interest stays in the CD until it matures. If you take interest out as it is paid, it does not compound and you earn a little less.</li>
      <li>Each month counts as 1/12 of a year. Banks that count actual days may differ by a few cents.</li>
      <li>The rate is fixed for the term, and nothing is added or withdrawn except in the early-withdrawal scenario.</li>
      <li>Inflation, fees and what happens at renewal are not included.</li>
    </ul>
    <p>Results are estimates, not an offer. Your bank's account disclosure lists the actual terms.</p>
  </section>

  <section class="content-section" aria-labelledby="cd-method-heading">
    <h2 id="cd-method-heading">Methodology and testing</h2>
    <p>Automated tests compare maturity values, APY conversions, compounding comparisons and early-withdrawal results with an independent
    calculation done to 40 significant digits. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.cdBasics, SOURCES.apyDefinition])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/certificate-of-deposit.js']
  };
}

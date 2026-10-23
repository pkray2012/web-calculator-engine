/**
 * EV Gas Savings Calculator page (draft, Home Energy Batch 2). Not imported
 * by scripts/build.js until the owner releases it. Every figure in the copy
 * is computed from the engine at build time; the gas side comes from the
 * site's Fuel Cost engine.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { plainDecimal } from '../../lib/energy/format.js';
import { savingsForm } from '../../components/energy/ev-gas-savings-form.js';
import { savingsResults, savingsQuickResult } from '../../components/energy/ev-gas-savings-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { SAVINGS_DEFAULTS, runSavingsCalculator } from '../../adapters/energy/ev-gas-savings.js';
import { findEnergyBatch2Calculator, relatedEnergyBatch2Calculators } from '../../content/energy-batch2.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

export function evGasSavingsPage() {
  const calculator = findEnergyBatch2Calculator('ev-gas-savings-calculator');
  const example = runSavingsCalculator(SAVINGS_DEFAULTS).view;
  const { input, result, evPerMileText, gasPerMileText } = example;
  const miles = formatCount(input.miles);
  const rate = `$${plainDecimal(input.rate)}`;
  const gasPrice = formatCurrency(input.pricePerGallon);
  const ev = formatCurrency(result.evCents / 100);
  const gas = formatCurrency(result.gasCents / 100);
  const savings = formatCurrency(result.savingsCents / 100);
  const source = ENERGY_SOURCES.epaLabelLosses;

  const faqs = [
    {
      question: 'How much does an electric car save on fuel?',
      answer: `It depends on your miles, the two cars' efficiency and your prices. For example, for ${miles} miles at ${input.kwhPer100Miles} kWh per 100 miles and ${rate} per kWh, electricity costs ${ev}; a ${input.mpg} MPG car at ${gasPrice} a gallon uses ${gas} of gas, so the EV saves ${savings} a year, ${formatCurrency(result.savingsPerMonthCents / 100)} a month (example values).`
    },
    {
      question: 'Do I need to add charging losses to the EPA figure?',
      answer: 'No. The EPA kWh per 100 miles is based on the electricity drawn from the outlet, so it already includes charging losses (EPA).'
    },
    {
      question: 'What does this comparison leave out?',
      answer: 'Everything except fuel: the purchase price, maintenance, insurance, registration and any incentives. Electricity is priced at one flat rate per kWh, without public-charger fees.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Fuel savings = gas cost (miles ÷ MPG × gas price) − electricity cost (miles × kWh per 100 miles ÷ 100 × rate).</strong>
  For example, ${miles} miles in an EV using ${input.kwhPer100Miles} kWh per 100 miles at ${rate} per kWh, against a ${input.mpg} MPG car at ${gasPrice} a gallon
  (example values): ${gas} − ${ev} = ${savings} a year.`)}
  <p class="lede">Compare a year of electricity for an electric car with a year of gas for a gas car, and see the cost per mile of each.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your driving and prices',
    form: savingsForm(SAVINGS_DEFAULTS, {}, savingsQuickResult(example)),
    exampleNote: `Example: ${miles} miles, ${input.kwhPer100Miles} kWh per 100 miles at ${rate} per kWh, against ${input.mpg} MPG at ${gasPrice} a gallon (illustrative values, not typical ones). Enter your own to update.`,
    results: savingsResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="evgas-how-heading">
    <h2 id="evgas-how-heading">How to compare EV and gas fuel costs</h2>
    <ol>
      <li><strong>Electricity:</strong> ${miles} miles × ${input.kwhPer100Miles} kWh ÷ 100 × ${rate} = ${ev} (${evPerMileText} a mile).</li>
      <li><strong>Gas:</strong> ${miles} miles ÷ ${input.mpg} MPG × ${gasPrice} = ${gas} (${gasPerMileText} a mile).</li>
      <li><strong>Savings:</strong> ${gas} − ${ev} = ${savings} a year.</li>
    </ol>
    <p class="formula"><code>Savings = miles ÷ MPG × gas price − miles × kWh per 100 miles ÷ 100 × rate</code></p>
    <p>The EPA figure is based on the electricity drawn from the outlet, so it already includes charging losses (<a href="${source.url}">EPA</a>).</p>
  </section>

  <section class="content-section" aria-labelledby="evgas-assumptions-heading">
    <h2 id="evgas-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Fuel only. Purchase price, maintenance, insurance and incentives are not included.</li>
      <li>One flat electricity rate and one gas price for the whole year.</li>
      <li>All-electric miles only. Plug-in hybrids that also use gasoline aren't covered.</li>
      <li>If gas works out cheaper, the savings show as a negative number.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="evgas-method-heading">
    <h2 id="evgas-method-heading">Methodology and testing</h2>
    <p>The gas cost uses the same engine as our fuel cost calculator. Costs per mile are shown in cents to two decimals, with the dollar figure taken from those rounded cents.
    Automated tests check the worked example, miles below 1, the MPG, price and rate limits and a case where gas is cheaper.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'evgas-faq')}

  ${sourcesSection([source, ENERGY_SOURCES.eiaStateAverages])}

  ${relatedLinks(relatedEnergyBatch2Calculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    structuredData: [faqStructuredData(faqs)],
    scripts: ['client/energy/ev-gas-savings.js']
  };
}

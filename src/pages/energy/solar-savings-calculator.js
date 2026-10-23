/**
 * Solar Savings Calculator page (draft, Home Energy Batch 2b, spec r8.1). Not
 * imported by scripts/build.js until the owner releases it. Every figure in
 * the copy is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { plainDecimal } from '../../lib/energy/format.js';
import { solarSavingsForm } from '../../components/energy/solar-savings-form.js';
import { solarSavingsResults, solarSavingsQuickResult } from '../../components/energy/solar-savings-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { SOLAR_SAVINGS_DEFAULTS, SOLAR_SAVINGS_EXAMPLE, runSolarSavingsCalculator } from '../../adapters/energy/solar-savings.js';
import { findEnergyBatch2bCalculator, relatedEnergyBatch2bCalculators } from '../../content/energy-batch2b.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

export const PLAN_DISCLOSURE = 'Billing rules for solar differ by utility and plan. Enter the credit your plan gives for each kWh sent to the grid; this calculator does not know your plan.';

export function solarSavingsPage() {
  const calculator = findEnergyBatch2bCalculator('solar-savings-calculator');
  const example = runSolarSavingsCalculator(SOLAR_SAVINGS_EXAMPLE).view;
  const { input, savingsText, perMonthText, selfKwhText, exportedKwhText } = example;
  const production = `${input.production.toLocaleString('en-US')} kWh`;
  const retail = `$${plainDecimal(input.retailRate)}`;
  const credit = `$${plainDecimal(input.exportRate)}`;
  const allHome = runSolarSavingsCalculator({ ...SOLAR_SAVINGS_EXAMPLE, selfUse: '100' }).view;

  const faqs = [
    {
      question: 'How do I estimate my bill savings from solar?',
      answer: `Split the yearly production into the kWh you use at home and the kWh sent to the grid. Value the first at your retail rate and the second at your plan's export credit, then subtract any yearly solar fees. For example (example values), ${selfKwhText} × ${retail} + ${exportedKwhText} × ${credit} = ${savingsText} a year, ${perMonthText} a month.`
    },
    {
      question: 'What export credit should I enter?',
      answer: `The credit your plan gives for each kWh you send to the grid, from your utility or your plan's terms. It has no default here. ${PLAN_DISCLOSURE}`
    },
    {
      question: 'Why does the share used at home matter?',
      answer: `Each kWh you use at home saves the retail rate, while each kWh sent to the grid earns your plan's export credit, which may be a different amount. For example (example values), with all ${production} used at home the savings would be ${allHome.savingsText} instead of ${savingsText}.`
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Savings = kWh used at home × retail rate + kWh sent to the grid × export credit − yearly solar fees.</strong>
  For example, ${production} with ${plainDecimal(input.selfUse)}% used at home at ${retail} per kWh and the rest credited at ${credit} (example values): ${savingsText} a year.`)}
  <p class="lede">Estimate how much a solar system lowers your electricity bills in a year, from its production, how much of it you use at home, your retail rate and your plan's export credit.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your production and rates',
    form: solarSavingsForm(SOLAR_SAVINGS_DEFAULTS, {}, solarSavingsQuickResult(example)),
    exampleNote: `Example: ${production} a year, ${plainDecimal(input.selfUse)}% used at home, ${retail} retail and ${credit} export credit (illustrative values, not typical ones or any plan's). Enter your own to update.`,
    results: solarSavingsResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="solsav-how-heading">
    <h2 id="solsav-how-heading">How to work out solar bill savings</h2>
    <ol>
      <li><strong>Used at home:</strong> ${production} × ${plainDecimal(input.selfUse)}% = ${selfKwhText}, valued at ${retail} per kWh.</li>
      <li><strong>Sent to the grid:</strong> the rest, ${exportedKwhText}, valued at ${credit} per kWh.</li>
      <li><strong>Savings:</strong> add the two and subtract any yearly solar fees: ${savingsText} a year.</li>
    </ol>
    <p class="formula"><code>Savings = production × share ÷ 100 × retail rate + production × (1 − share ÷ 100) × export credit − fees</code></p>
  </section>

  <section class="content-section" aria-labelledby="solsav-assumptions-heading">
    <h2 id="solsav-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>${PLAN_DISCLOSURE}</li>
      <li>One flat retail rate and one export credit for the whole year. Time-of-use rates are not modeled.</li>
      <li>The production is your figure, for example from your installer's estimate; this page does not estimate it.</li>
      <li>An estimate of bill savings, not a bill.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="solsav-method-heading">
    <h2 id="solsav-method-heading">Methodology and testing</h2>
    <p>Every result is calculated exactly from the numbers you enter and rounded once, so a figure of exactly half a cent is never shown a cent low.
    Automated tests check the worked example, all production used at home or sent to the grid, fees larger than the savings and the limits on every field.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'solsav-faq')}

  ${sourcesSection([ENERGY_SOURCES.eiaStateAverages])}

  ${relatedLinks(relatedEnergyBatch2bCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    structuredData: [faqStructuredData(faqs)],
    scripts: ['client/energy/solar-savings.js']
  };
}

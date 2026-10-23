/**
 * Electricity Cost Calculator page (draft, Home Energy Batch 2). Not imported
 * by scripts/build.js until the owner releases it. Every figure in the copy
 * is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { plainDecimal } from '../../lib/energy/format.js';
import { electricityCostForm } from '../../components/energy/electricity-cost-form.js';
import { electricityCostResults, electricityCostQuickResult } from '../../components/energy/electricity-cost-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { ELECTRICITY_COST_DEFAULTS, runElectricityCostCalculator } from '../../adapters/energy/electricity-cost.js';
import { findEnergyBatch2Calculator, relatedEnergyBatch2Calculators } from '../../content/energy-batch2.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

export function electricityCostPage() {
  const calculator = findEnergyBatch2Calculator('electricity-cost-calculator');
  const example = runElectricityCostCalculator(ELECTRICITY_COST_DEFAULTS).view;
  const { input, result, kwhText, kwhPerDayText } = example;
  const rate = `$${plainDecimal(input.rate)}`;
  const cost = formatCurrency(result.costCents / 100);
  const source = ENERGY_SOURCES.applianceEnergy;

  const faqs = [
    {
      question: 'How do I calculate the cost to run an appliance?',
      answer: `Multiply its watts by the hours it runs each day and divide by 1,000 to get kWh per day, multiply by the number of days, then multiply by your rate. For example (example values), ${input.watts} W × ${input.hours} hours ÷ 1,000 = ${kwhPerDayText} a day; over ${input.days} days that is ${kwhText}, or ${cost} at ${rate} per kWh.`
    },
    {
      question: 'Why can the estimate be higher than my real use?',
      answer: 'The watts on the label are the most the appliance draws. Many appliances, such as refrigerators, cycle on and off, and others run below full power, so they use less than the label suggests. A plug-in energy meter gives a measured figure.'
    },
    {
      question: 'Which electricity rate should I use?',
      answer: 'Use the rate you pay for each extra kWh, from your rate plan, not your bill\'s average cost per kWh.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>kWh = watts × hours per day × days ÷ 1,000; cost = kWh × your rate.</strong> For example, ${input.watts} W for ${input.hours} hours a day over ${input.days} days
  is ${kwhText.replace('.00', '')}; at an example rate of ${rate} per kWh that is ${cost}.`)}
  <p class="lede">Find what an appliance or device costs to run from its power, how many hours a day it runs and your electricity rate.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your appliance and rate',
    form: electricityCostForm(ELECTRICITY_COST_DEFAULTS, {}, electricityCostQuickResult(example)),
    exampleNote: `Example: ${input.watts} W for ${input.hours} hours a day over ${input.days} days at ${rate} per kWh (illustrative values, not typical ones). Enter your own to update.`,
    results: electricityCostResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="elcost-how-heading">
    <h2 id="elcost-how-heading">How to work out the cost to run an appliance</h2>
    <ol>
      <li><strong>kWh per day:</strong> ${input.watts} W × ${input.hours} hours ÷ 1,000 = ${kwhPerDayText}.</li>
      <li><strong>kWh for the period:</strong> ${kwhPerDayText} × ${input.days} days = ${kwhText}.</li>
      <li><strong>Cost:</strong> ${kwhText} × ${rate} = ${cost}.</li>
    </ol>
    <p class="formula"><code>Cost = watts × hours per day × days ÷ 1,000 × rate per kWh</code></p>
    <p>This is the method in Virginia Cooperative Extension's guide to appliance energy use (<a href="${source.url}">Virginia Tech</a>).</p>
  </section>

  <section class="content-section" aria-labelledby="elcost-assumptions-heading">
    <h2 id="elcost-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>The appliance draws the watts you enter for every hour you enter. Nameplate watts are a maximum; appliances that cycle on and off use less.</li>
      <li>One flat rate per kWh. Tiered and time-of-use rates and fixed charges are not modeled.</li>
      <li>Power from 0.01 W to 1,000,000 W, up to 24 hours a day and 366 days.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="elcost-method-heading">
    <h2 id="elcost-method-heading">Methodology and testing</h2>
    <p>The cost is calculated exactly from the numbers you enter and rounded half up to the cent once, so a cost of exactly half a cent is never shown a cent low.
    Automated tests check the worked example, zero hours, the power, hours, days and rate limits and a rate typed in cents.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'elcost-faq')}

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
    scripts: ['client/energy/electricity-cost.js']
  };
}

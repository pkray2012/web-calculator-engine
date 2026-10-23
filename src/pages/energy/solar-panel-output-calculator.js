/**
 * Solar Panel Output Calculator page (draft, Home Energy Batch 2b, spec
 * r8.1). Not imported by scripts/build.js until the owner releases it. Every
 * figure in the copy is computed from the engine at build time; 4.5 sun hours
 * and 14% losses are example inputs, never defaults or typical values.
 */

import { html } from '../../lib/html.js';
import { plainDecimal } from '../../lib/energy/format.js';
import { outputForm } from '../../components/energy/solar-panel-output-form.js';
import { outputResults, outputQuickResult } from '../../components/energy/solar-panel-output-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { OUTPUT_DEFAULTS, OUTPUT_EXAMPLE, runOutputCalculator } from '../../adapters/energy/solar-panel-output.js';
import { findEnergyBatch2bCalculator, relatedEnergyBatch2bCalculators } from '../../content/energy-batch2b.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

export function solarPanelOutputPage() {
  const calculator = findEnergyBatch2bCalculator('solar-panel-output-calculator');
  const example = runOutputCalculator(OUTPUT_EXAMPLE).view;
  const { input, dailyText, annualText, monthlyText } = example;
  const size = `${plainDecimal(input.sizeKw)} kW`;
  const sun = plainDecimal(input.sunHours);
  const losses = `${plainDecimal(input.losses)}%`;

  const faqs = [
    {
      question: 'How much electricity does a solar system produce?',
      answer: `Multiply its size in kW by the peak sun hours and by (1 − losses) for the kWh a day, then by 365 for a year. For example (example values), ${size} × ${sun} × (1 − ${losses}) = ${dailyText} a day, ${annualText} a year.`
    },
    {
      question: 'Why is the monthly figure an average?',
      answer: `It is the yearly figure divided by 12 (${monthlyText} in the example). Real output changes from month to month with the season and the weather, so the figure is not a forecast for any one month.`
    },
    {
      question: 'Where do I get peak sun hours and losses?',
      answer: 'From a solar resource map for your location, your installer\'s design or a solar design tool. This calculator has no default or typical value for either: enter your own.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>kWh per day = system size (kW) × peak sun hours × (1 − losses); per year = per day × 365.</strong> For example, a ${size} system
  with ${sun} sun hours and ${losses} losses (example values) makes ${dailyText} a day, ${annualText} a year.`)}
  <p class="lede">Estimate how many kWh a solar system makes per day, month and year from its size, your peak sun hours and system losses.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your system and site',
    form: outputForm(OUTPUT_DEFAULTS, {}, outputQuickResult(example)),
    exampleNote: `Example: a ${size} system, ${sun} sun hours and ${losses} losses (example inputs, not defaults or typical values). Enter your own to update.`,
    results: outputResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="paneloutput-how-heading">
    <h2 id="paneloutput-how-heading">How to work out solar output</h2>
    <ol>
      <li><strong>Per day:</strong> ${size} × ${sun} hours × (1 − ${losses}) = ${dailyText}.</li>
      <li><strong>Per year:</strong> per day × 365 = ${annualText}.</li>
      <li><strong>Per month (average):</strong> per year ÷ 12 = ${monthlyText}.</li>
    </ol>
    <p class="formula"><code>kWh per day = size (kW DC) × sun hours × (1 − losses ÷ 100)</code></p>
    <p>The size is the DC rating, the total of the panels' watt ratings, which is how residential solar sizes are usually quoted (<a href="${ENERGY_SOURCES.dcRating.url}">Annual Technology Baseline</a>).</p>
  </section>

  <section class="content-section" aria-labelledby="paneloutput-assumptions-heading">
    <h2 id="paneloutput-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Peak sun hours and losses are yours, from a solar resource map, your installer or a design tool. Neither has a default.</li>
      <li>The same sun hours and losses every day. Output varies with the season and the weather; the monthly figure is an average, not a forecast.</li>
      <li>An estimate, not a system design: shading and inverter limits are not checked.</li>
      <li>System size from 0.001 kW to 1,000 kW, peak sun hours from 0.1 to 24 a day and losses from 0% to 99%; losses of 50% or more get a note to check the value.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="paneloutput-method-heading">
    <h2 id="paneloutput-method-heading">Methodology and testing</h2>
    <p>Each figure is calculated exactly from the numbers you enter and rounded once to two decimals, so an average of exactly 894.615 kWh shows as 894.62 kWh.
    Automated tests check the worked examples, very small outputs, very high losses and the limits on every field.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'paneloutput-faq')}

  ${sourcesSection([ENERGY_SOURCES.dcRating])}

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
    scripts: ['client/energy/solar-panel-output.js']
  };
}

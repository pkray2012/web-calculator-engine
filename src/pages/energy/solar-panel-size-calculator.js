/**
 * Solar Panel Size Calculator page (draft, Home Energy Batch 2b, spec r8.1).
 * Not imported by scripts/build.js until the owner releases it. Every figure
 * in the copy is computed from the engine at build time; 4.5 sun hours and
 * 14% losses are example inputs, never defaults or typical values.
 */

import { html } from '../../lib/html.js';
import { plainDecimal } from '../../lib/energy/format.js';
import { sizeForm } from '../../components/energy/solar-panel-size-form.js';
import { sizeResults, sizeQuickResult } from '../../components/energy/solar-panel-size-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { SIZE_DEFAULTS, SIZE_EXAMPLE, runSizeCalculator } from '../../adapters/energy/solar-panel-size.js';
import { findEnergyBatch2bCalculator, relatedEnergyBatch2bCalculators } from '../../content/energy-batch2b.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

export function solarPanelSizePage() {
  const calculator = findEnergyBatch2bCalculator('solar-panel-size-calculator');
  const example = runSizeCalculator(SIZE_EXAMPLE).view;
  const { input, sizeText, panelsText } = example;
  const annual = `${input.annualKwh.toLocaleString('en-US')} kWh`;
  const sun = plainDecimal(input.sunHours);
  const losses = `${plainDecimal(input.losses)}%`;
  const exact = runSizeCalculator({ annualKwh: '7300', sunHours: '4', losses: '0', panelWatts: '500' }).view;

  const faqs = [
    {
      question: 'How do I work out what size solar system I need?',
      answer: `Divide the kWh a year you want to cover by the peak sun hours × 365 × (1 − losses). For example (example values), ${annual} ÷ (${sun} × 365 × (1 − ${losses})) = ${sizeText}, or ${panelsText} panels of ${plainDecimal(input.panelWatts)} W.`
    },
    {
      question: 'Where do I get peak sun hours and losses?',
      answer: 'From a solar resource map for your location, your installer\'s design or a solar design tool. This calculator has no default or typical value for either: enter your own.'
    },
    {
      question: 'Why is the panel count rounded up?',
      answer: `The panels must cover the size, so the count is the smallest whole number of panels whose watts add up to at least the size. It is calculated exactly: for example (example values), ${exact.sizeText} of 500 W panels is ${exact.panelsText} panels, not ${Number(exact.panelsText) + 1}.`
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>System size (kW) = yearly kWh ÷ (peak sun hours × 365 × (1 − losses)).</strong> For example, ${annual} a year
  with ${sun} sun hours and ${losses} losses (example values) needs ${sizeText}, or ${panelsText} panels of ${plainDecimal(input.panelWatts)} W.`)}
  <p class="lede">Find the solar system size, in kW, that covers the electricity you use in a year, from your peak sun hours and system losses, and how many panels that is.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your use and site',
    form: sizeForm(SIZE_DEFAULTS, {}, sizeQuickResult(example)),
    exampleNote: `Example: ${annual} a year, ${sun} sun hours and ${losses} losses (example inputs, not defaults or typical values). Enter your own to update.`,
    results: sizeResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="panelsize-how-heading">
    <h2 id="panelsize-how-heading">How to work out solar system size</h2>
    <ol>
      <li><strong>Yearly output per kW:</strong> peak sun hours × 365 × (1 − losses) = ${sun} × 365 × (1 − ${losses}) in the example.</li>
      <li><strong>Size:</strong> yearly kWh ÷ that figure = ${sizeText}.</li>
      <li><strong>Panels:</strong> the size in watts ÷ one panel's watts, rounded up = ${panelsText}.</li>
    </ol>
    <p class="formula"><code>Size (kW DC) = yearly kWh ÷ (sun hours × 365 × (1 − losses ÷ 100))</code></p>
    <p>The size is the DC rating, the total of the panels' watt ratings, which is how residential solar sizes are usually quoted (<a href="${ENERGY_SOURCES.dcRating.url}">Annual Technology Baseline</a>).</p>
  </section>

  <section class="content-section" aria-labelledby="panelsize-assumptions-heading">
    <h2 id="panelsize-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Peak sun hours and losses are yours, from a solar resource map, your installer or a design tool. Neither has a default.</li>
      <li>A year of 365 days, and the same sun hours and losses all year.</li>
      <li>An estimate, not a system design: roof space, shading and inverter limits are not checked, and the array's area is not calculated.</li>
      <li>Peak sun hours from 0.1 to 24 a day and losses from 0% to 99%; losses of 50% or more get a note to check the value.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="panelsize-method-heading">
    <h2 id="panelsize-method-heading">Methodology and testing</h2>
    <p>The size is calculated exactly from the numbers you enter and rounded once to two decimals; the panel count is an exact whole-number division, rounded up.
    Automated tests check the worked examples, an exact panel count, very high losses and the limits on every field.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'panelsize-faq')}

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
    scripts: ['client/energy/solar-panel-size.js']
  };
}

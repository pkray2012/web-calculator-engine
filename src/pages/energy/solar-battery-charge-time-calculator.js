/**
 * Solar Battery Charging Time Calculator page (draft, Home Energy Batch 1).
 * Not imported by scripts/build.js until the owner releases it. Every figure
 * in the copy is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { batteryForm } from '../../components/energy/charging-time-form.js';
import { chargeResults, chargeQuickResult } from '../../components/energy/charging-time-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { BATTERY_DEFAULTS, runBatteryCalculator } from '../../adapters/energy/charging-time.js';
import { findEnergyCalculator, relatedEnergyCalculators } from '../../content/energy-batch1.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

/** The pre-rendered example: the form's numbers, with the power measured going into the battery. */
export const BATTERY_EXAMPLE = Object.freeze({ ...BATTERY_DEFAULTS, basis: 'battery' });

export function solarBatteryChargeTimePage() {
  const calculator = findEnergyCalculator('solar-battery-charge-time-calculator');
  const example = runBatteryCalculator(BATTERY_EXAMPLE).view;
  const wall = runBatteryCalculator({ ...BATTERY_EXAMPLE, basis: 'wall', efficiency: '90' }).view;
  const { input } = example;
  const energy = example.energyText.replace('.00', '');
  const sources = [ENERGY_SOURCES.kilowattHour];

  const faqs = [
    {
      question: 'Why does the measurement point matter?',
      answer: `Some energy is lost while charging. If the power is measured at the wall or source, divide by the efficiency once: ${energy} at ${input.powerKw} kW and 90% efficiency takes ${wall.timeText}, not ${example.timeText}. Use "going into the battery" only if the figure is the power actually going into the battery, for example a battery monitor's or charge controller's reading of battery input; a charger's or station's displayed figure may not be measured there.`
    },
    {
      question: 'Why can real charging take longer?',
      answer: 'The calculator assumes constant power. In practice charging power can change, often slowing as the battery gets close to full, and temperature and other loads on the system also affect it.'
    },
    {
      question: 'Should I use usable or nominal capacity?',
      answer: 'Use the usable capacity: the energy the battery actually lets you store and use, which can be less than its total or nominal rating.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Charge time ≈ energy needed ÷ charging power</strong>, where energy = usable capacity × (target % − current %).
  ${input.capacityKwh} kWh from ${input.startPercent}% to ${input.targetPercent}% at ${input.powerKw} kW is ${example.timeText}.`)}
  <p class="lede">Estimate how long a home or solar battery takes to charge from its usable capacity, charge levels and charging power.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your battery',
    form: batteryForm(BATTERY_DEFAULTS, {}, chargeQuickResult(example)),
    exampleNote: `Example: ${input.capacityKwh} kWh from ${input.startPercent}% to ${input.targetPercent}% at ${input.powerKw} kW measured going into the battery (illustrative values). Choose where your power is measured and enter your own to update.`,
    results: chargeResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="battery-how-heading">
    <h2 id="battery-how-heading">How to estimate charging time</h2>
    <ol>
      <li><strong>Energy to add:</strong> usable capacity × (target − current) ÷ 100: ${input.capacityKwh} × (${input.targetPercent} − ${input.startPercent}) ÷ 100 = ${energy}.</li>
      <li><strong>Divide by the charging power:</strong> ${energy} ÷ ${input.powerKw} kW = ${example.timeText} when the power is measured going into the battery.</li>
      <li><strong>Measured at the wall or source?</strong> Multiply the power by the charging efficiency first: at 90%, ${wall.timeText}.</li>
    </ol>
    <p class="formula"><code>Hours = capacity × (target % − current %) ÷ 100 ÷ (power × efficiency)</code></p>
    <p>One kilowatt of power for one hour is one kilowatt-hour (<a href="${ENERGY_SOURCES.kilowattHour.url}">NIST</a>). The time formula is derived from that, assuming constant power.</p>
  </section>

  <section class="content-section" aria-labelledby="battery-assumptions-heading">
    <h2 id="battery-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Constant charging power. Charging often slows near full, and temperature and other loads change it; none of that is modeled.</li>
      <li>Efficiency is applied once, and only when the power is measured at the wall or source. There is no default efficiency: enter your own.</li>
      <li>Solar output changes through the day, so with panels charging the battery directly, use an average charging power.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="battery-method-heading">
    <h2 id="battery-method-heading">Methodology and testing</h2>
    <p>Times are rounded half up to whole minutes, with days added from 48 hours. Automated tests check the worked examples, both measurement points,
    equal and reversed charge levels, efficiency limits and very long and very short charges. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'battery-faq')}

  ${sourcesSection(sources)}

  ${relatedLinks(relatedEnergyCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    structuredData: [faqStructuredData(faqs)],
    scripts: ['client/energy/solar-battery-charge-time.js']
  };
}

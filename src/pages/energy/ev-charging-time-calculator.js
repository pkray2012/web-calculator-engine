/**
 * EV Charging Time Calculator page (draft, Home Energy Batch 1). Not imported
 * by scripts/build.js until the owner releases it. Every figure in the copy
 * is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { evTimeForm } from '../../components/energy/charging-time-form.js';
import { chargeResults, chargeQuickResult } from '../../components/energy/charging-time-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { EV_TIME_DEFAULTS, runEvTimeCalculator } from '../../adapters/energy/charging-time.js';
import { findEnergyCalculator, relatedEnergyCalculators } from '../../content/energy-batch1.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

/** The pre-rendered example: the form's numbers, measured at the wall, at an illustrative 90% efficiency. */
export const EV_TIME_EXAMPLE = Object.freeze({ ...EV_TIME_DEFAULTS, basis: 'wall', efficiency: '90' });

export function evChargingTimePage() {
  const calculator = findEnergyCalculator('ev-charging-time-calculator');
  const example = runEvTimeCalculator(EV_TIME_EXAMPLE).view;
  const capped = runEvTimeCalculator({ ...EV_TIME_EXAMPLE, vehicleMax: '6.6' }).view;
  const { input } = example;
  const energy = example.energyText.replace('.00', '');
  const afdc = ENERGY_SOURCES.homeCharging;

  const faqs = [
    {
      question: 'What affects EV charging time?',
      answer: `How empty the battery is, its capacity, the vehicle's onboard charger and the charging equipment (U.S. Department of Energy). Adding ${energy} (${input.startPercent}% to ${input.targetPercent}% of ${input.capacityKwh} kWh) at ${input.powerKw} kW and 90% efficiency takes about ${example.timeText}.`
    },
    {
      question: 'Why is my car charging slower than the charger rating?',
      answer: `On AC charging the car's onboard charger sets a maximum rate. If it is lower than the charger's, that is the rate that counts: with a ${capped.result.effectivePowerKw} kW vehicle maximum, the same charge takes ${capped.timeText}.`
    },
    {
      question: 'Why does charging slow down near full?',
      answer: 'Charging power varies with how full the battery is and usually drops as it approaches full. The calculator assumes constant power, so real charges to a high level can take longer.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Charge time ≈ energy added ÷ (charger power × efficiency)</strong> when power is measured at the wall.
  Adding ${energy} (${input.startPercent}% to ${input.targetPercent}% of ${input.capacityKwh} kWh) at ${input.powerKw} kW and 90% takes about ${example.timeText}.`)}
  <p class="lede">Estimate how long an electric car takes to charge from its battery size, charge levels, charger power and efficiency,
  including your car's maximum AC charging rate. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your car and charger',
    form: evTimeForm(EV_TIME_DEFAULTS, {}, chargeQuickResult(example)),
    exampleNote: `Example: ${input.capacityKwh} kWh from ${input.startPercent}% to ${input.targetPercent}% at ${input.powerKw} kW measured at the wall, at 90% efficiency (illustrative values, not typical ones). Choose where your power is measured and enter your own to update.`,
    results: chargeResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="evtime-how-heading">
    <h2 id="evtime-how-heading">How to estimate EV charging time</h2>
    <ol>
      <li><strong>Energy to add:</strong> ${input.capacityKwh} kWh × (${input.targetPercent}% − ${input.startPercent}%) = ${energy}.</li>
      <li><strong>Power reaching the battery:</strong> ${input.powerKw} kW × 90% efficiency.</li>
      <li><strong>Divide:</strong> ${energy} ÷ (${input.powerKw} × 0.9) kW = ${example.timeText}.</li>
    </ol>
    <p class="formula"><code>Hours = capacity × (target % − start %) ÷ 100 ÷ (min(charger power, vehicle maximum) × efficiency)</code></p>
  </section>

  <section class="content-section" aria-labelledby="evtime-assumptions-heading">
    <h2 id="evtime-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Constant charging power. Power varies with how full the battery is and often drops near full, so charges to a high level can take longer.</li>
      <li>Efficiency is applied once, only when the power is measured at the wall. There is no default efficiency: enter your own.</li>
      <li>The vehicle's maximum AC rate applies to AC charging measured at the wall. It is ignored for power measured going into the battery.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="evtime-method-heading">
    <h2 id="evtime-method-heading">Methodology and testing</h2>
    <p>Times are rounded half up to whole minutes, with days added from 48 hours. Automated tests check the worked examples, both measurement points,
    the vehicle maximum, equal and reversed charge levels and the input limits. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'evtime-faq')}

  ${sourcesSection([afdc])}

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
    scripts: ['client/energy/ev-charging-time.js']
  };
}

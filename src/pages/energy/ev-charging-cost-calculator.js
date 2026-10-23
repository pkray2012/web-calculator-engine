/**
 * EV Charging Cost Calculator page (draft, Home Energy Batch 1). Not imported
 * by scripts/build.js until the owner releases it. Every figure in the copy
 * is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { evCostForm } from '../../components/energy/ev-charging-cost-form.js';
import { evCostResults, evCostQuickResult } from '../../components/energy/ev-charging-cost-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { EV_COST_DEFAULTS, runEvCostCalculator } from '../../adapters/energy/ev-charging-cost.js';
import { findEnergyCalculator, relatedEnergyCalculators } from '../../content/energy-batch1.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';
import { releasedOnly } from '../../content/energy-release.js';

/** The pre-rendered example: the form's numbers at an illustrative 90% efficiency. */
export const EV_COST_EXAMPLE = Object.freeze({ ...EV_COST_DEFAULTS, efficiency: '90' });

export function evChargingCostPage() {
  const calculator = findEnergyCalculator('ev-charging-cost-calculator');
  const example = runEvCostCalculator(EV_COST_EXAMPLE).view;
  const epa = runEvCostCalculator({ ...EV_COST_EXAMPLE, figureType: 'epa', figure: '30', milesPerMonth: '1000' }).view;
  const { input, result } = example;
  const rate = formatCurrency(input.rate);
  const perCharge = formatCurrency(result.costPerCharge);
  const source = ENERGY_SOURCES.epaLabelLosses;

  const faqs = [
    {
      question: 'How do I calculate EV charging cost per mile?',
      answer: `Multiply the kWh per 100 miles on the EPA label by your rate, then divide by 100. For example, at 30 kWh per 100 miles and ${rate} per kWh, that is ${epa.perMileText} a mile, or ${formatCurrency(epa.result.perMile.monthlyCents / 100)} for 1,000 miles (example values).`
    },
    {
      question: 'Should I add charging losses to the EPA figure?',
      answer: 'No. The EPA label figure is based on the electricity drawn from the outlet, so it already includes charging losses (EPA). Adding them again would overstate the cost. A trip-computer miles-per-kWh figure is used as your vehicle reports it, and the charging efficiency you enter is applied once.'
    },
    {
      question: 'Which electricity rate should I use?',
      answer: 'Use the rate you pay for each extra kWh, from your rate plan, not your bill\'s average cost per kWh.'
    },
    {
      question: 'Does this work for plug-in hybrids?',
      answer: 'Only for their all-electric miles. Miles driven on gasoline are not covered.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Cost per charge = energy added ÷ charging efficiency × your electricity rate.</strong> Adding ${example.batteryText.replace('.00', '')} at 90% efficiency draws
  ${example.meteredText.replace('.00', '')}; at ${rate}/kWh that is ${perCharge}.`)}
  <p class="lede">Work out what it costs to charge an electric car at home, per charge from the battery size and charging efficiency, and per mile from the EPA label
  or your vehicle's trip computer. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your car and rate',
    form: evCostForm(EV_COST_DEFAULTS, {}, evCostQuickResult(example)),
    exampleNote: `Example: ${input.capacityKwh} kWh from ${input.startPercent}% to ${input.targetPercent}% at 90% efficiency and ${rate} per kWh (illustrative values, not typical ones). Enter your efficiency and rate to update.`,
    results: evCostResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="evcost-how-heading">
    <h2 id="evcost-how-heading">How to work out EV charging cost</h2>
    <ol>
      <li><strong>Energy into the battery:</strong> ${input.capacityKwh} kWh × (${input.targetPercent}% − ${input.startPercent}%) = ${example.batteryText}.</li>
      <li><strong>Energy from the wall:</strong> ${example.batteryText} ÷ 90% = ${example.meteredText}.</li>
      <li><strong>Cost:</strong> ${example.meteredText} × ${rate} = ${perCharge}.</li>
    </ol>
    <p class="formula"><code>Cost per mile = EPA kWh per 100 miles ÷ 100 × rate</code></p>
    <p>The EPA figure is based on the electricity drawn from the outlet, so it already includes charging losses (<a href="${source.url}">EPA</a>).
    With a trip-computer figure in miles per kWh, the cost per mile is the rate ÷ (mi/kWh × charging efficiency): the figure is used as your vehicle reports it, and the efficiency you enter is applied once.</p>
  </section>

  <section class="content-section" aria-labelledby="evcost-assumptions-heading">
    <h2 id="evcost-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>One flat rate per kWh. Time-of-use rates, fixed charges and public-charger fees are not modeled.</li>
      <li>Charging efficiency has no default: enter your own. It is applied once.</li>
      <li>All-electric miles only. Plug-in hybrids that also use gasoline aren't covered.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="evcost-method-heading">
    <h2 id="evcost-method-heading">Methodology and testing</h2>
    <p>The cost per mile is shown in cents to two decimals, with the dollar figure taken from those rounded cents, both rounded half up.
    Automated tests check the worked examples, both efficiency figures, the rate and figure limits and the rounding at half a cent.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'evcost-faq')}

  ${sourcesSection([source, ENERGY_SOURCES.eiaStateAverages])}

  ${relatedLinks(releasedOnly(relatedEnergyCalculators(calculator.slug)))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    structuredData: [faqStructuredData(faqs)],
    scripts: ['client/energy/ev-charging-cost.js']
  };
}

/**
 * EV Cost Per Mile Calculator page (draft, Home Energy Batch 2). Not imported
 * by scripts/build.js until the owner releases it. Every figure in the copy
 * is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { plainDecimal } from '../../lib/energy/format.js';
import { perMileForm } from '../../components/energy/ev-cost-per-mile-form.js';
import { perMileResults, perMileQuickResult } from '../../components/energy/ev-cost-per-mile-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { PER_MILE_DEFAULTS, PER_MILE_EXAMPLE, runPerMileCalculator } from '../../adapters/energy/ev-cost-per-mile.js';
import { findEnergyBatch2Calculator, relatedEnergyBatch2Calculators } from '../../content/energy-batch2.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

export function evCostPerMilePage() {
  const calculator = findEnergyBatch2Calculator('ev-cost-per-mile-calculator');
  const example = runPerMileCalculator(PER_MILE_EXAMPLE).view;
  const tripComputer = runPerMileCalculator({ ...PER_MILE_EXAMPLE, figureType: 'dashboard', figure: '4', efficiency: '90', annualMiles: '' }).view;
  const { input, result, perMileText, milesPerKwhText } = example;
  const rate = `$${plainDecimal(input.rate)}`;
  const per100 = formatCurrency(result.costPer100MilesCents / 100);
  const annual = formatCurrency(result.annualCents / 100);
  const miles = formatCount(input.annualMiles);
  const source = ENERGY_SOURCES.epaLabelLosses;

  const faqs = [
    {
      question: 'How do I calculate an electric car\'s cost per mile?',
      answer: `Divide the kWh per 100 miles on the EPA label by 100 and multiply by your rate. For example, at ${input.figure} kWh per 100 miles and ${rate} per kWh (example values), that is ${perMileText} a mile, ${per100} per 100 miles, or ${annual} for ${miles} miles.`
    },
    {
      question: 'Should I add charging losses to the EPA figure?',
      answer: `No. The EPA figure is based on the electricity drawn from the outlet, so it already includes charging losses (EPA). A trip-computer miles-per-kWh figure is used as your vehicle reports it, and the charging efficiency you enter is applied once: for example, 4 mi/kWh at 90% efficiency with electricity at ${rate} per kWh (example values) is ${tripComputer.perMileText} a mile.`
    },
    {
      question: 'Which electricity rate should I use?',
      answer: 'Use the rate you pay for each extra kWh, from your rate plan, not your bill\'s average cost per kWh.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Cost per mile = EPA kWh per 100 miles ÷ 100 × your electricity rate.</strong> For example, ${input.figure} kWh per 100 miles at ${rate} per kWh
  (example values) is ${perMileText} a mile, ${per100} per 100 miles.`)}
  <p class="lede">Find an electric car's electricity cost per mile, per 100 miles and per year from its EPA label or trip-computer figure and your rate.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your car and rate',
    form: perMileForm(PER_MILE_DEFAULTS, {}, perMileQuickResult(example)),
    exampleNote: `Example: ${input.figure} kWh per 100 miles (EPA) at ${rate} per kWh and ${miles} miles a year (illustrative values, not typical ones). Choose your figure type and enter your own numbers to update.`,
    results: perMileResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="permile-how-heading">
    <h2 id="permile-how-heading">How to work out cost per mile</h2>
    <ol>
      <li><strong>Cost per mile:</strong> ${input.figure} kWh ÷ 100 × ${rate} = ${perMileText}.</li>
      <li><strong>Per 100 miles:</strong> ${perMileText.split(' ')[0]} × 100 = ${per100}.</li>
      <li><strong>Per year:</strong> ${perMileText.split(' ')[0]} × ${miles} miles = ${annual}.</li>
    </ol>
    <p class="formula"><code>Cost per mile = kWh per 100 miles ÷ 100 × rate</code></p>
    <p>The EPA figure is based on the electricity drawn from the outlet, so it already includes charging losses (<a href="${source.url}">EPA</a>); ${input.figure} kWh per 100 miles is ${milesPerKwhText} miles per kWh.
    With a trip-computer figure in miles per kWh, the cost per mile is the rate ÷ (mi/kWh × charging efficiency): the figure is used as your vehicle reports it, and the efficiency you enter is applied once.</p>
  </section>

  <section class="content-section" aria-labelledby="permile-assumptions-heading">
    <h2 id="permile-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>One flat rate per kWh. Time-of-use rates, fixed charges and public-charger fees are not modeled.</li>
      <li>Charging efficiency has no default. It is used only with a trip-computer figure, and applied once, as entered.</li>
      <li>A trip-computer figure is used as your vehicle reports it. The calculator makes no assumption about where the vehicle measures it.</li>
      <li>All-electric miles only. Plug-in hybrids that also use gasoline aren't covered.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="permile-method-heading">
    <h2 id="permile-method-heading">Methodology and testing</h2>
    <p>The cost per mile is shown in cents to two decimals, with the dollar figure taken from those rounded cents, both rounded half up.
    Automated tests check the worked examples, both efficiency figures, the rate and figure limits and the rounding at half a cent.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'permile-faq')}

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
    scripts: ['client/energy/ev-cost-per-mile.js']
  };
}

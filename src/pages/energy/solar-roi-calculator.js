/**
 * Solar ROI Calculator page (draft, Home Energy Batch 2b, spec r8.1). Not
 * imported by scripts/build.js until the owner releases it. Every figure in
 * the copy is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { roiForm } from '../../components/energy/solar-roi-form.js';
import { roiResults, roiQuickResult, ROI_DEFINITION } from '../../components/energy/solar-roi-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { ROI_DEFAULTS, runRoiCalculator } from '../../adapters/energy/solar-roi.js';
import { findEnergyBatch2bCalculator, relatedEnergyBatch2bCalculators } from '../../content/energy-batch2b.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

const whole = (text) => text.replace(/\.00$/, '');

export function solarRoiPage() {
  const calculator = findEnergyBatch2bCalculator('solar-roi-calculator');
  const example = runRoiCalculator(ROI_DEFAULTS).view;
  const { input, roiText, netCostText, totalText, gainText } = example;
  const cost = whole(netCostText);
  const savings = whole(`$${(input.savingsCents / 100).toLocaleString('en-US')}`);
  const loss = runRoiCalculator({ ...ROI_DEFAULTS, savings: '500', years: '10' }).view;
  const doe = ENERGY_SOURCES.simplePayback;

  const faqs = [
    {
      question: 'How is solar ROI worked out on this page?',
      answer: `Total net savings over the years you choose, minus the net cost, as a percentage of the net cost. For example (example values), a ${cost} system saving ${savings} a year for ${input.years} years saves ${whole(totalText)}, a net gain of ${whole(gainText)}: an ROI of ${roiText}. This is a simple ROI, the page's own definition.`
    },
    {
      question: 'How is ROI different from the payback period?',
      answer: 'The payback period is how many years the savings take to cover the cost. ROI is how much the savings exceed the cost over a period you choose, as a percentage of the cost, so it changes with the number of years.'
    },
    {
      question: 'Why can the ROI be negative?',
      answer: `If the savings over the period are less than the net cost, the net gain is negative. For example (example values), a ${cost} system saving $500 a year for 10 years saves ${whole(loss.totalText)}: an ROI of ${loss.roiText}.`
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>ROI = (net savings per year × years − net cost) ÷ net cost × 100%.</strong> For example, a ${cost} system saving ${savings} a year
  for ${input.years} years (example values) saves ${whole(totalText)}: a net gain of ${whole(gainText)}, an ROI of ${roiText}.`)}
  <p class="lede">Estimate the simple return on a solar system over the number of years you choose, from its cost, any incentives, your yearly bill savings and maintenance.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your system',
    form: roiForm(ROI_DEFAULTS, {}, roiQuickResult(example)),
    exampleNote: `Example: a ${cost} system that saves ${savings} a year, over ${input.years} years (illustrative values, not typical ones). Enter your own to update.`,
    results: roiResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="roi-how-heading">
    <h2 id="roi-how-heading">How to work out a simple solar ROI</h2>
    <ol>
      <li><strong>Net cost:</strong> installed cost minus any incentives you receive (${cost} in the example).</li>
      <li><strong>Net savings per year:</strong> yearly bill savings minus yearly maintenance.</li>
      <li><strong>Total net savings:</strong> net savings per year × the number of years: ${savings} × ${input.years} = ${whole(totalText)}.</li>
      <li><strong>ROI:</strong> (total net savings − net cost) ÷ net cost × 100% = ${whole(gainText)} ÷ ${cost} = ${roiText}.</li>
    </ol>
    <p class="formula"><code>ROI = ((yearly savings − yearly maintenance) × years − (cost − incentives)) ÷ (cost − incentives) × 100%</code></p>
    <p>This is the calculator's own definition of a simple ROI, not a sourced one. ${ROI_DEFINITION}</p>
  </section>

  <section class="content-section" aria-labelledby="roi-assumptions-heading">
    <h2 id="roi-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>The same savings and maintenance every year: no change in electricity prices and no loss of panel output over time.</li>
      <li>No time value of money and no financing costs.</li>
      <li>Only the incentives you enter are subtracted. If they cover the whole cost, no ROI is defined, so none is shown.</li>
      <li>A whole number of years from 1 to 50. Over 25 years the page notes that this is longer than the 25-year lifetime used as an example in the NREL guide.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="roi-method-heading">
    <h2 id="roi-method-heading">Methodology and testing</h2>
    <p>Amounts are converted to whole cents, so the totals and the net gain are exact; the ROI is rounded once to one decimal.
    Automated tests check the worked examples, incentives equal to the cost, losses, break-even and the limits on every field.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'roi-faq')}

  ${sourcesSection([doe])}

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
    scripts: ['client/energy/solar-roi.js']
  };
}

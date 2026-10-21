/**
 * Solar Payback Period Calculator page (draft, Home Energy Batch 1). Not
 * imported by scripts/build.js until the owner releases it. Every figure in
 * the copy is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { paybackForm } from '../../components/energy/solar-payback-form.js';
import { paybackResults, paybackQuickResult } from '../../components/energy/solar-payback-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { PAYBACK_DEFAULTS, parsePaybackForm, buildPaybackView, runPaybackCalculator } from '../../adapters/energy/solar-payback.js';
import { findEnergyCalculator, relatedEnergyCalculators } from '../../content/energy-batch1.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

export function solarPaybackPage() {
  const calculator = findEnergyCalculator('solar-payback-calculator');
  const example = buildPaybackView(parsePaybackForm(PAYBACK_DEFAULTS).input);
  const cost = formatCurrency(example.netCost).replace('.00', '');
  const savings = formatCurrency(example.netSavings).replace('.00', '');
  const years = example.result.years;
  const withMaintenance = runPaybackCalculator({ ...PAYBACK_DEFAULTS, maintenance: '100' }).view;
  const doe = ENERGY_SOURCES.simplePayback;

  const faqs = [
    {
      question: 'What is a solar payback period?',
      answer: `It is how many years of bill savings it takes to cover what you paid for the system. The U.S. Department of Energy's simple payback divides the cost by the yearly value of the electricity the system produces: ${cost} ÷ ${savings} a year = ${years} years.`
    },
    {
      question: 'What does simple payback leave out?',
      answer: 'It ignores the time value of money, changes in electricity prices and the slow loss of panel output over time. None of these is modeled here, so treat the result as a rough comparison, not a forecast.'
    },
    {
      question: 'Is payback the same as ROI?',
      answer: 'No. Payback only says how long until the savings cover the cost. It is not a return on investment, an internal rate of return or a discounted payback.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Simple payback = net installed cost ÷ yearly bill savings</strong> (DOE simple payback, no time value of money).
  ${cost} ÷ ${savings} a year = ${years} years.`)}
  <p class="lede">Find the simple payback period of a solar system from its cost, any incentives, your yearly bill savings and maintenance.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your system',
    form: paybackForm(PAYBACK_DEFAULTS, {}, paybackQuickResult(example)),
    exampleNote: `Example: a ${cost} system that saves ${savings} a year (illustrative values, not typical ones). Enter your own to update.`,
    results: paybackResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="payback-how-heading">
    <h2 id="payback-how-heading">How to work out simple payback</h2>
    <ol>
      <li><strong>Net cost:</strong> installed cost minus any incentives you receive.</li>
      <li><strong>Net yearly savings:</strong> yearly bill savings minus yearly maintenance.</li>
      <li><strong>Divide:</strong> ${cost} ÷ ${savings} = ${years} years. With $100 a year of maintenance, ${cost} ÷ ${formatCurrency(withMaintenance.netSavings).replace('.00', '')} = ${withMaintenance.display}.</li>
    </ol>
    <p class="formula"><code>Payback (years) = (cost − incentives) ÷ (yearly savings − yearly maintenance)</code></p>
    <p>The Department of Energy defines simple payback as cost divided by the yearly value of the energy produced
    (<a href="${doe.url}">${doe.publisher}</a>). Subtracting maintenance is an extension of that definition, applied only to the amount you enter.</p>
  </section>

  <section class="content-section" aria-labelledby="payback-assumptions-heading">
    <h2 id="payback-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>The same savings every year: no change in electricity prices and no loss of panel output over time.</li>
      <li>No time value of money and no financing costs. If you take a loan, see the Solar Financing Calculator for the cost of borrowing.</li>
      <li>Only the incentives you enter are subtracted. Tax credits are not calculated.</li>
      <li>If yearly savings minus maintenance is zero or negative, the cost is never recovered and no payback is shown.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="payback-method-heading">
    <h2 id="payback-method-heading">Methodology and testing</h2>
    <p>Amounts are converted to whole cents. The payback is rounded once to whole months, and the years shown come from that month count.
    Automated tests check the worked examples, incentives equal to the cost, zero and negative net savings and paybacks near 100 years.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'payback-faq')}

  ${sourcesSection([doe])}

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
    scripts: ['client/energy/solar-payback.js']
  };
}

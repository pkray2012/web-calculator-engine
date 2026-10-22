/**
 * Electricity Rate Calculator page (draft, Home Energy Batch 2). Not imported
 * by scripts/build.js until the owner releases it. Every figure in the copy
 * is computed from the engine at build time. User-input arithmetic only: the
 * page makes no claim about how utilities define or set rates.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { rateForm } from '../../components/energy/electricity-rate-form.js';
import { rateResults, rateQuickResult } from '../../components/energy/electricity-rate-results.js';
import { relatedLinks } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { RATE_DEFAULTS, RESIDUAL_LABEL, RATE_NOTES, runRateCalculator } from '../../adapters/energy/electricity-rate.js';
import { findEnergyBatch2Calculator, relatedEnergyBatch2Calculators } from '../../content/energy-batch2.js';

export function electricityRatePage() {
  const calculator = findEnergyBatch2Calculator('electricity-rate-calculator');
  const example = runRateCalculator(RATE_DEFAULTS).view;
  const { input, result, averageText, residualText } = example;
  const bill = formatCurrency(result.bill);
  const excluded = formatCurrency(result.excluded);
  const kwh = `${formatCount(input.kwh)} kWh`;

  const faqs = [
    {
      question: 'How do I find my price per kWh from my bill?',
      answer: `Divide the bill total by the kWh used. ${bill} ÷ ${kwh} = ${averageText} per kWh. That average includes every charge on the bill.`
    },
    {
      question: `What is the "${RESIDUAL_LABEL.toLowerCase()}"?`,
      answer: `It is the bill minus the charges you choose to leave out, divided by the kWh: (${bill} − ${excluded}) ÷ ${kwh} = ${residualText}. ${RATE_NOTES.residual}`
    },
    {
      question: 'Which rate should I use for EV charging or solar savings?',
      answer: 'The rate you pay for each extra kWh, from your rate plan. The averages on this page spread fixed charges over every kWh, and charging a car or making your own power does not change those fixed charges.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Average cost per kWh = bill ÷ kWh used.</strong> ${bill} ÷ ${kwh} = ${averageText};
  leaving out ${excluded} of fixed charges gives ${residualText}.`)}
  <p class="lede">Work out what you paid per kWh from your electric bill, with and without the fixed charges you choose to leave out.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your bill',
    form: rateForm(RATE_DEFAULTS, {}, rateQuickResult(example)),
    exampleNote: `Example: a ${bill} bill for ${kwh} with ${excluded} of fixed charges (illustrative values, not typical ones). Enter your own to update.`,
    results: rateResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="elrate-how-heading">
    <h2 id="elrate-how-heading">How to work out your cost per kWh</h2>
    <ol>
      <li><strong>Average cost per kWh:</strong> ${bill} ÷ ${kwh} = ${averageText}.</li>
      <li><strong>${RESIDUAL_LABEL}:</strong> (${bill} − ${excluded}) ÷ ${kwh} = ${residualText}.</li>
    </ol>
    <p class="formula"><code>Cost per kWh = (bill − charges you exclude) ÷ kWh used</code></p>
  </section>

  <section class="content-section" aria-labelledby="elrate-assumptions-heading">
    <h2 id="elrate-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Both results are averages over the billing period. Neither is the price of one more kWh.</li>
      <li>${RATE_NOTES.residual}</li>
      <li>Only the amounts you enter are used; the calculator does not know your rate plan.</li>
      <li>The kWh must be at least 1, and the bill from $0.01 to $1,000,000.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="elrate-method-heading">
    <h2 id="elrate-method-heading">Methodology and testing</h2>
    <p>Dollar amounts are converted to whole cents, so leaving out charges is exact; results are rounded half up to a hundredth of a cent per kWh only for display.
    Automated tests check the worked example, excluding the whole bill, the kWh and bill limits and amounts with more than two decimals.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'elrate-faq')}

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
    scripts: ['client/energy/electricity-rate.js']
  };
}

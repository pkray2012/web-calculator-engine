/**
 * Electric Bill Calculator page (draft, Home Energy Batch 1). Not imported by
 * scripts/build.js until the owner releases it. Every figure in the copy is
 * computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { billForm } from '../../components/energy/electric-bill-form.js';
import { billResults, billQuickResult } from '../../components/energy/electric-bill-results.js';
import { relatedLinks } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { BILL_DEFAULTS, parseBillForm, buildBillView } from '../../adapters/energy/electric-bill.js';
import { findEnergyCalculator, relatedEnergyCalculators } from '../../content/energy-batch1.js';

export function electricBillPage() {
  const calculator = findEnergyCalculator('electric-bill-calculator');
  const example = buildBillView(parseBillForm(BILL_DEFAULTS).input);
  const { input, result, averageText } = example;
  const rate = formatCurrency(input.rate);
  const fixed = formatCurrency(result.fixed);
  const bill = formatCurrency(result.billCents / 100);

  const faqs = [
    {
      question: 'How is an electric bill calculated?',
      answer: `In the simplest case, multiply the kWh you used by your energy rate and add the fixed charges: ${input.kwh} kWh × ${rate} + ${fixed} = ${bill}. Real bills can have tiered or time-of-use rates, riders and taxes; this calculator includes only the charges you enter.`
    },
    {
      question: 'What is an average rate per kWh?',
      answer: `It is the whole bill divided by the kWh used. In the example, ${bill} ÷ ${input.kwh} kWh = ${averageText}, higher than the ${Math.round(input.rate * 100)}¢ energy rate because the fixed charges are spread over every kWh. It is an average, not the price of one more kWh.`
    },
    {
      question: 'Why does my bill change month to month?',
      answer: 'Mostly because your usage changes, for example with heating, cooling and the length of the billing period. Some rate plans also charge differently by season or time of day.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Electric bill ≈ kWh used × your energy rate + fixed monthly charges.</strong> ${input.kwh} kWh × ${rate} + ${fixed} = ${bill},
  an average of ${averageText} per kWh over a ${input.days}-day bill.`)}
  <p class="lede">Estimate an electric bill from the kWh you used, your rate and your fixed charges, with the daily cost and the average cost per kWh.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your usage and rate',
    form: billForm(BILL_DEFAULTS, {}, billQuickResult(example)),
    exampleNote: `Example: ${input.kwh} kWh at ${rate} per kWh plus ${fixed} of fixed charges (illustrative values, not typical ones). Enter your own to update.`,
    results: billResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="bill-how-heading">
    <h2 id="bill-how-heading">How to estimate an electric bill</h2>
    <ol>
      <li><strong>Energy charge:</strong> kWh used × rate: ${input.kwh} × ${rate} = ${formatCurrency(result.energyCents / 100)}.</li>
      <li><strong>Add fixed charges:</strong> ${formatCurrency(result.energyCents / 100)} + ${fixed} = ${bill}.</li>
      <li><strong>Daily cost:</strong> ${bill} ÷ ${input.days} days = ${formatCurrency(result.dailyCents / 100)}, fixed charges included.</li>
    </ol>
    <p class="formula"><code>Bill = kWh × rate per kWh + fixed charges</code></p>
  </section>

  <section class="content-section" aria-labelledby="bill-assumptions-heading">
    <h2 id="bill-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>One flat energy rate for every kWh. Tiered, time-of-use and demand charges are not modeled.</li>
      <li>Fixed charges are what you enter. Add taxes or fees to them if you want them included.</li>
      <li>The average cost per kWh is shown from 1 kWh of use, and 12 × this bill is not a forecast.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="bill-method-heading">
    <h2 id="bill-method-heading">Methodology and testing</h2>
    <p>Fixed charges are converted to whole cents; results are rounded to the cent only for display.
    Automated tests check the worked example, zero and tiny usage, the billing-period limits and a rate typed in cents.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'bill-faq')}

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
    scripts: ['client/energy/electric-bill.js']
  };
}

/**
 * Utility Cost Calculator page (draft, Home Energy Batch 1). Not imported by
 * scripts/build.js until the owner releases it. Every figure in the copy is
 * computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { utilityForm } from '../../components/energy/utility-cost-form.js';
import { utilityResults, utilityQuickResult } from '../../components/energy/utility-cost-results.js';
import { relatedLinks } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { UTILITY_DEFAULTS, parseUtilityForm, buildUtilityView } from '../../adapters/energy/utility-cost.js';
import { findEnergyCalculator, relatedEnergyCalculators } from '../../content/energy-batch1.js';

export function utilityCostPage() {
  const calculator = findEnergyCalculator('utility-cost-calculator');
  const example = buildUtilityView(parseUtilityForm(UTILITY_DEFAULTS).input);
  const { result } = example;
  const sum = example.shares.map((row) => formatCurrency(row.amount).replace('.00', '')).join(' + ');
  const total = formatCurrency(result.monthly);
  const twelve = formatCurrency(result.twelveTimesMonthly);
  const largest = example.shares.reduce((best, row) => (row.share > best.share ? row : best));

  const faqs = [
    {
      question: 'How do I estimate my monthly utility costs?',
      answer: `Add up this month's bills. For example, ${sum} = ${total} a month.`
    },
    {
      question: 'Which bills count as utilities?',
      answer: 'The calculator has a line for electricity, gas, water, sewer, trash and internet, plus "Other" for anything else you pay each month, such as a heating-oil or propane delivery averaged to a month. Leave out any you don\'t pay.'
    },
    {
      question: 'Can I use this for a yearly budget?',
      answer: `The page shows 12 × this month's total (${twelve} in the example), but that is not a forecast. Heating, cooling and water use change with the seasons, so a single month can be well above or below your average. Adding up a full year of bills gives a better yearly figure.`
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Your monthly utilities total is the sum of each bill.</strong> ${sum} = ${total} a month.
  The page also shows 12 × this month's total (${twelve}); that is not a forecast, because bills vary by month.`)}
  <p class="lede">Add up your electricity, gas, water, sewer, trash and internet bills to see your monthly total and each bill's share.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your bills',
    form: utilityForm(UTILITY_DEFAULTS, {}, utilityQuickResult(example)),
    exampleNote: `Example: ${sum} a month (illustrative amounts, not typical bills). Enter your own bills to update.`,
    results: utilityResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="utility-how-heading">
    <h2 id="utility-how-heading">How to add up your utility costs</h2>
    <ol>
      <li><strong>Gather this month's bills:</strong> electricity, gas, water, sewer, trash, internet and anything else you pay monthly.</li>
      <li><strong>Add them up:</strong> ${sum} = ${total}.</li>
      <li><strong>Find each share:</strong> divide each bill by the total. In the example, ${largest.label.toLowerCase()} is the largest at ${largest.shareText}.</li>
    </ol>
    <p class="formula"><code>Monthly total = sum of this month's bills</code></p>
  </section>

  <section class="content-section" aria-labelledby="utility-assumptions-heading">
    <h2 id="utility-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>It adds the amounts you enter; it does not estimate any bill for you.</li>
      <li>12 × this month's total is shown for budgeting, not as a forecast. No seasonal adjustment is applied.</li>
      <li>Shares are rounded to one decimal place, so they may not add up to exactly 100.0%.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="utility-method-heading">
    <h2 id="utility-method-heading">Methodology and testing</h2>
    <p>Amounts are converted to whole cents and added exactly. Each share is the bill divided by the total, rounded half up to one decimal place.
    Automated tests check the worked example, blank and zero bills, the limits and the rounding. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'utility-faq')}

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
    scripts: ['client/energy/utility-cost.js']
  };
}

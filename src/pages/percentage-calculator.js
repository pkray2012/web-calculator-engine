/**
 * Percentage Calculator page. Example results, the table and every worked
 * figure in the explanatory content are computed from the engine at build
 * time.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { percentForm } from '../components/percentage-form.js';
import { percentResults, percentQuickResult, fmt } from '../components/percentage-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { PERCENT_DEFAULTS, parsePercentForm, buildPercentView } from '../adapters/percentage.js';
import { percentOf, whatPercent, percentChange, percentOff } from '../calculators/percentage.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';
import { faqSection, faqStructuredData, directAnswer } from '../components/faq.js';

const TABLE_PERCENTS = [5, 10, 15, 20, 25, 30, 50, 75];
const TABLE_VALUES = [20, 50, 80, 100, 250, 1000];

function exampleView(overrides = {}) {
  return buildPercentView(parsePercentForm({ ...PERCENT_DEFAULTS, ...overrides }).input);
}

export function percentagePage() {
  const calculator = findCalculator('percentage-calculator');
  const example = exampleView();
  const d = PERCENT_DEFAULTS;
  const of = percentOf({ percent: Number(d.ofPercent), of: Number(d.ofValue) });
  const is = whatPercent({ part: Number(d.isPart), whole: Number(d.isWhole) });
  const change = percentChange({ from: Number(d.changeFrom), to: Number(d.changeTo) });
  const rate = percentChange({ from: 4, to: 5 });
  const off = percentOff({ price: Number(d.offPrice), percent: Number(d.offPercent) });
  const stacked = percentOff({ price: Number(d.offPrice), percent: Number(d.offPercent), extraPercent: 10 });

  // Direct answer and FAQ figures, all from the engine.
  const faqOf = percentOf({ percent: 20, of: 150 });
  const faqIs = whatPercent({ part: 30, whole: 120 });
  const faqUp = percentChange({ from: 80, to: 100 });
  const faqDown = percentChange({ from: 100, to: 80 });
  const faqOff = percentOff({ price: 80, percent: 25 });
  const faqs = [
    { question: 'How do I calculate a percentage of a number?', answer: `Multiply the number by the percentage and divide by 100. 20% of 150 is 150 × 20 ÷ 100 = ${fmt(faqOf.result)}.` },
    { question: 'How do I find what percent one number is of another?', answer: `Divide the part by the whole and multiply by 100. 30 out of 120 is 30 ÷ 120 × 100 = ${fmt(faqIs.percent)}%.` },
    { question: 'How do I calculate a percent increase?', answer: `Subtract the old value from the new one, divide by the old value and multiply by 100. Going from 80 to 100 is (100 − 80) ÷ 80 × 100 = ${fmt(faqUp.percent)}%.` },
    { question: 'How do I calculate a percent decrease?', answer: `Use the same formula; the result is negative. Going from 100 to 80 is (80 − 100) ÷ 100 × 100 = −${fmt(Math.abs(faqDown.percent))}%, a ${fmt(Math.abs(faqDown.percent))}% decrease.` },
    { question: 'Why does a 25% increase not cancel a 25% decrease?', answer: `Each percentage is taken of a different starting value. After rising from 80 to 100 (+${fmt(faqUp.percent)}%), it takes a ${fmt(Math.abs(faqUp.reversePercent))}% decrease, not 25%, to get back to 80.` },
    { question: 'How do I work out a price after a percent-off discount?', answer: `Multiply the price by (1 − the discount ÷ 100). $80 at 25% off is $80 × 0.75 = $${fmt(faqOff.salePrice)}, a saving of $${fmt(faqOff.saving)}.` }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>X% of Y = Y × X ÷ 100, and percent change = (new − old) ÷ old × 100.</strong> For example, 20% of 150 is ${fmt(faqOf.result)},
  and going from 80 to 100 is a ${fmt(faqUp.percent)}% increase.`)}
  <p class="lede">Find a percentage of a number, what percent one number is of another, the percent increase or decrease between two numbers,
  or the price after a percent-off discount, with the formula for each. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your numbers',
    form: percentForm(PERCENT_DEFAULTS, {}, percentQuickResult(example)),
    exampleNote: `Example: ${d.ofPercent}% of ${d.ofValue}. Choose another question or enter your numbers to update.`,
    results: percentResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="pct-of-heading">
    <h2 id="pct-of-heading">How to find a percentage of a number</h2>
    <p>Percent means “per hundred”: the % sign stands for the number 0.01 (<a href="${SOURCES.nistPercent.url}">NIST Guide to the SI, chapter 7</a>). So
    ${fmt(of.percent)}% of ${fmt(of.of)} is ${fmt(of.of)} × ${fmt(of.percent)} ÷ 100 = ${fmt(of.result)}. To do it in your head, find 10% by moving the decimal point one place
    left (${fmt(of.of / 10)}) and scale from there: 5% is half of that and 15% is the two added together.</p>
  </section>

  <section class="content-section" aria-labelledby="pct-is-heading">
    <h2 id="pct-is-heading">How to find what percent one number is of another</h2>
    <p>Divide the part by the whole and multiply by 100: ${fmt(is.part)} ÷ ${fmt(is.whole)} × 100 = ${fmt(is.percent)}%. For example, ${fmt(is.part)} correct answers
    out of ${fmt(is.whole)} is a score of ${fmt(is.percent)}%.</p>
  </section>

  <section class="content-section" aria-labelledby="pct-change-heading">
    <h2 id="pct-change-heading">How to calculate percent increase or decrease</h2>
    <p class="formula"><code>Percent change = (new − old) ÷ old × 100</code></p>
    <p>From ${fmt(change.from)} to ${fmt(change.to)} is (${fmt(change.to)} − ${fmt(change.from)}) ÷ ${fmt(change.from)} × 100 = ${fmt(change.percent)}%. Going back is not the same
    percentage: from ${fmt(change.to)} down to ${fmt(change.from)} is ${fmt(change.reversePercent)}%, because the change is measured against a larger starting value.</p>
    <p><strong>Percent vs percentage points.</strong> When a rate moves from 4% to 5%, it rises by 1 percentage point, which is a ${fmt(rate.percent)}% increase in
    the rate. Saying it “rose 1%” is ambiguous, so say which you mean.</p>
    <p><strong>Percent difference</strong> compares two values without a direction, against their average: |a − b| ÷ ((a + b) ÷ 2) × 100. For
    ${fmt(change.from)} and ${fmt(change.to)} that is ${fmt(change.differencePercent)}%.</p>
  </section>

  <section class="content-section" aria-labelledby="pct-off-heading">
    <h2 id="pct-off-heading">How to calculate percent off</h2>
    <p>Multiply the price by 1 minus the discount as a decimal: ${formatCurrency(off.price)} × (1 − ${off.percent / 100}) = ${formatCurrency(off.salePrice)}, a saving of
    ${formatCurrency(off.saving)}.</p>
    <p>Discounts in a row multiply rather than add: ${fmt(stacked.percent)}% off and then another ${fmt(stacked.extraPercent)}% off is ${formatCurrency(stacked.salePrice)},
    ${fmt(stacked.totalPercentOff)}% off in total, not ${fmt(stacked.percent + stacked.extraPercent)}%. Sales tax, if any, is usually charged on the discounted price.</p>
  </section>

  <section class="content-section" aria-labelledby="pct-table-heading">
    <h2 id="pct-table-heading">Common percentages</h2>
    ${dataTable({
      id: 'pct-table',
      title: 'Percent of common numbers',
      columns: [{ key: 'pct', label: 'Percent' }, ...TABLE_VALUES.map((v) => ({ key: `v${v}`, label: `of ${v.toLocaleString('en-US')}`, numeric: true }))],
      rows: TABLE_PERCENTS.map((p) => ({
        pct: `${p}%`,
        ...Object.fromEntries(TABLE_VALUES.map((v) => [`v${v}`, fmt(percentOf({ percent: p, of: v }).result)]))
      }))
    })}
  </section>

  <section class="content-section" aria-labelledby="pct-method-heading">
    <h2 id="pct-method-heading">Methodology and testing</h2>
    <p>Results are shown to up to four decimal places. Automated tests check hand-worked examples, that finding a percentage and then asking what
    percent it is gives the starting percentage back, that a change and its reverse bring a value back to where it started, and that stacked
    discounts multiply. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'pct-faq')}

  ${sourcesSection([SOURCES.nistPercent])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    structuredData: [faqStructuredData(faqs)],
    scripts: ['client/percentage.js']
  };
}

/**
 * Tip Calculator page. Example results, the table and every worked figure
 * in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { tipForm } from '../components/tip-form.js';
import { tipResults, tipQuickResult } from '../components/tip-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { TIP_DEFAULTS, parseTipForm, buildTipView } from '../adapters/tip.js';
import { calculateTip } from '../calculators/tip.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

const TABLE_BILLS = [20, 40, 50, 75, 100, 150, 200];
const TABLE_PERCENTS = [15, 18, 20, 22, 25];

function exampleView(overrides = {}) {
  return buildTipView(parseTipForm({ ...TIP_DEFAULTS, ...overrides }).input);
}

export function tipPage() {
  const calculator = findCalculator('tip-calculator');
  const example = exampleView();
  const bill = example.bill;
  const ten = calculateTip({ bill, tipPercent: 10 });
  const fifteen = calculateTip({ bill, tipPercent: 15 });
  const twenty = calculateTip({ bill, tipPercent: 20 });
  const preTax = calculateTip({ bill, tipPercent: 20, tax: 6.4, tipOnPreTax: true });
  const rounded = calculateTip({ bill, tipPercent: 20, people: 3, roundUp: true });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out the tip and total for a bill at any percentage, split it evenly between any number of people, tip on the amount
  before tax, and round each share up to a whole dollar. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your bill',
    form: tipForm(TIP_DEFAULTS, {}, tipQuickResult(example)),
    exampleNote: `Example: a ${formatCurrency(bill)} bill with a ${example.tipPercent}% tip, split between ${example.people} people. Enter your bill to update.`,
    results: tipResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="tip-how-heading">
    <h2 id="tip-how-heading">How to calculate a tip</h2>
    <p>Multiply the bill by the tip percentage and divide by 100: ${formatCurrency(bill)} × 20 ÷ 100 = ${formatCurrency(twenty.tip)}. In your head:</p>
    <ul>
      <li><strong>10%:</strong> move the decimal point one place left: ${formatCurrency(ten.tip)}.</li>
      <li><strong>20%:</strong> double the 10% figure: ${formatCurrency(twenty.tip)}.</li>
      <li><strong>15%:</strong> 10% plus half of it: ${formatCurrency(ten.tip)} + ${formatCurrency(ten.tip / 2)} ≈ ${formatCurrency(fifteen.tip)}.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="tip-tax-heading">
    <h2 id="tip-tax-heading">Tipping before or after tax</h2>
    <p>Some people tip on the total, others on the amount before tax. On a ${formatCurrency(bill)} check that includes ${formatCurrency(preTax.tax)} of tax, a 20% tip is
    ${formatCurrency(twenty.tip)} on the total or ${formatCurrency(preTax.tip)} on the ${formatCurrency(preTax.tipBase)} before tax. Enter the tax from the check and tick the box to
    tip on the pre-tax amount.</p>
  </section>

  <section class="content-section" aria-labelledby="tip-split-heading">
    <h2 id="tip-split-heading">Splitting the bill</h2>
    <p>Divide the total with tip by the number of people. When it does not divide evenly to the cent, the calculator rounds each share up so the
    shares always cover the bill. Rounding each share up to a whole dollar adds a little to the tip: split three ways, ${formatCurrency(bill)} with a 20% tip
    becomes ${formatCurrency(rounded.perPerson)} each, a ${formatCurrency(rounded.tip)} tip (${rounded.effectiveTipPercent.toFixed(1)}%).</p>
  </section>

  <section class="content-section" aria-labelledby="tip-table-heading">
    <h2 id="tip-table-heading">Tips on common bill amounts</h2>
    ${dataTable({
      id: 'tip-common',
      title: 'Tip by bill amount and percentage',
      columns: [{ key: 'bill', label: 'Bill' }, ...TABLE_PERCENTS.map((p) => ({ key: `p${p}`, label: `${p}%`, numeric: true }))],
      rows: TABLE_BILLS.map((amount) => ({
        bill: formatCurrency(amount),
        ...Object.fromEntries(TABLE_PERCENTS.map((p) => [`p${p}`, formatCurrency(calculateTip({ bill: amount, tipPercent: p }).tip)]))
      }))
    })}
  </section>

  <section class="content-section" aria-labelledby="tip-wages-heading">
    <h2 id="tip-wages-heading">Why tips matter to servers</h2>
    <p>Under federal law, an employer may pay a tipped employee a cash wage as low as $2.13 an hour and count tips toward the rest of the federal minimum
    wage of $7.25; if tips fall short, the employer must make up the difference (<a href="${SOURCES.dolTippedEmployees.url}">U.S. Department of Labor: tipped
    employees</a>). Many states set higher minimums for tipped workers. Customs for how much to tip vary by service and place; the calculator lets you
    choose any percentage.</p>
  </section>

  <section class="content-section" aria-labelledby="tip-method-heading">
    <h2 id="tip-method-heading">Methodology and testing</h2>
    <p>Tip = bill (or bill before tax) × percentage, rounded to the cent; each share = total ÷ people, rounded up to the cent. Automated tests check
    hand-worked examples, that shares always cover the total, that rounding up to a dollar never charges less, and the pre-tax option.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.dolTippedEmployees])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/tip.js']
  };
}

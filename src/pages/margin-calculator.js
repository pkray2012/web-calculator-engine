/**
 * Profit Margin Calculator page. Example results, the conversion table and
 * every worked figure in the explanatory content are computed from the engine
 * at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { marginForm } from '../components/margin-form.js';
import { marginResults, marginQuickResult } from '../components/margin-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { MARGIN_DEFAULTS, parseMarginForm, buildMarginView } from '../adapters/margin.js';
import { analyzeSale, priceForMargin, priceForMarkup, marginFromMarkup, markupFromMargin } from '../calculators/margin.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

const TABLE_MARKUPS = [10, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200];
const pct = (value) => `${Number(value.toFixed(1)).toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;

function exampleView(overrides = {}) {
  return buildMarginView(parseMarginForm({ ...MARGIN_DEFAULTS, ...overrides }).input);
}

export function marginPage() {
  const calculator = findCalculator('margin-calculator');
  const example = exampleView();
  const { sale } = example;
  const target = priceForMargin({ cost: sale.cost, marginPercent: 40 });
  const wrong = priceForMarkup({ cost: sale.cost, markupPercent: 40 });
  const breakEven = analyzeSale({ cost: sale.cost, price: sale.price, fixedCosts: 5000 });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out the profit margin and markup on a sale from its cost and selling price, or find the price that gives the margin or
  markup you want, with an optional break-even point for your fixed costs. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your product',
    form: marginForm(MARGIN_DEFAULTS, {}, marginQuickResult(example)),
    exampleNote: `Example: an item that costs ${formatCurrency(sale.cost)} and sells for ${formatCurrency(sale.price)}. Enter your numbers to update.`,
    results: marginResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="margin-how-heading">
    <h2 id="margin-how-heading">How to calculate profit margin and markup</h2>
    <ol>
      <li><strong>Profit:</strong> selling price − cost: ${formatCurrency(sale.price)} − ${formatCurrency(sale.cost)} = ${formatCurrency(sale.profit)}.</li>
      <li><strong>Margin:</strong> profit ÷ selling price × 100: ${formatCurrency(sale.profit)} ÷ ${formatCurrency(sale.price)} = ${pct(sale.marginPercent)}.</li>
      <li><strong>Markup:</strong> profit ÷ cost × 100: ${formatCurrency(sale.profit)} ÷ ${formatCurrency(sale.cost)} = ${pct(sale.markupPercent)}.</li>
    </ol>
    <p>Margin and markup describe the same sale from two sides. Margin is measured against the price the customer pays; markup against what the
    item cost you. Markup is always the larger number for a profitable sale.</p>
  </section>

  <section class="content-section" aria-labelledby="margin-price-heading">
    <h2 id="margin-price-heading">How to price for a target margin</h2>
    <p>Divide the cost by 1 minus the margin as a decimal: ${formatCurrency(target.cost)} ÷ (1 − 0.40) = ${formatCurrency(target.price)} for a 40% margin.</p>
    <p>A common mistake is to add the margin percentage to the cost as if it were a markup: ${formatCurrency(wrong.cost)} + 40% = ${formatCurrency(wrong.price)}, which is
    only a ${pct(wrong.marginPercent)} margin. To earn 40% of the selling price you need a ${pct(target.markupPercent)} markup.</p>
    <p class="formula"><code>Price = cost ÷ (1 − margin)  ·  Price = cost × (1 + markup)</code></p>
  </section>

  <section class="content-section" aria-labelledby="margin-table-heading">
    <h2 id="margin-table-heading">Markup to margin conversion</h2>
    <p>Margin = markup ÷ (1 + markup); markup = margin ÷ (1 − margin).</p>
    ${dataTable({
      id: 'margin-table',
      title: 'Markup and the profit margin it gives',
      columns: [{ key: 'markup', label: 'Markup' }, { key: 'margin', label: 'Margin', numeric: true }, { key: 'price', label: 'Price for a $100 cost', numeric: true }],
      rows: TABLE_MARKUPS.map((markup) => ({
        markup: `${markup}%`,
        margin: pct(marginFromMarkup(markup)),
        price: formatCurrency(priceForMarkup({ cost: 100, markupPercent: markup }).price)
      }))
    })}
    <p>A 50% margin needs a ${pct(markupFromMargin(50))} markup: the price is double the cost.</p>
  </section>

  <section class="content-section" aria-labelledby="margin-breakeven-heading">
    <h2 id="margin-breakeven-heading">Break-even point</h2>
    <p>Your fixed costs, such as rent and salaries, have to be covered before any sale earns a profit. Divide them by the profit on each unit:
    ${formatCurrency(breakEven.fixedCosts)} ÷ ${formatCurrency(breakEven.profit)} = ${formatCount(breakEven.breakEvenUnits)} units to break even
    (<a href="${SOURCES.sbaBreakEven.url}">U.S. Small Business Administration: break-even point</a>). The SBA calls price minus variable cost per unit
    the contribution margin; enter the cost of one unit as the variable cost.</p>
  </section>

  <section class="content-section" aria-labelledby="margin-assumptions-heading">
    <h2 id="margin-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>This is gross margin on one unit: selling price against the cost of the item. Operating costs, taxes and interest are not subtracted, so it
      is not your net profit margin.</li>
      <li>Sales tax collected from customers is not part of the selling price for margin purposes.</li>
      <li>Break-even assumes one product at one price and cost. Several products need a weighted average.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="margin-method-heading">
    <h2 id="margin-method-heading">Methodology and testing</h2>
    <p>Automated tests check hand-worked examples, that pricing for a margin or markup gives back exactly that margin or markup, that the markup and
    margin conversions invert each other, and break-even rounding. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.sbaBreakEven])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/margin.js']
  };
}

/**
 * Sales Tax Calculator page. Example results, the table and every worked
 * figure in the explanatory content are computed from the engine at build
 * time.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { salesTaxForm } from '../components/sales-tax-form.js';
import { salesTaxResults, salesTaxQuickResult } from '../components/sales-tax-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { SALES_TAX_DEFAULTS, parseSalesTaxForm, buildSalesTaxView } from '../adapters/sales-tax.js';
import { addSalesTax, removeSalesTax, findSalesTaxRate, roundCents } from '../calculators/sales-tax.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

const TABLE_AMOUNTS = [10, 20, 50, 100, 250, 500, 1000];
const TABLE_RATES = [5, 6, 7, 8, 9, 10];

function exampleView(overrides = {}) {
  return buildSalesTaxView(parseSalesTaxForm({ ...SALES_TAX_DEFAULTS, ...overrides }).input);
}

export function salesTaxPage() {
  const calculator = findCalculator('sales-tax-calculator');
  const example = exampleView();
  const add = example.result;
  const rate = add.ratePercent;
  const remove = removeSalesTax({ total: add.total, ratePercent: rate });
  const wrongTax = roundCents(add.total * rate / 100);
  const found = findSalesTaxRate({ price: add.price, total: add.total });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Add sales tax to a price, take the tax back out of a total you paid, or work out the tax rate from a receipt. Enter the
  combined rate for where you buy. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your purchase',
    form: salesTaxForm(SALES_TAX_DEFAULTS, {}, salesTaxQuickResult(example)),
    exampleNote: `Example: a ${formatCurrency(add.price)} purchase at a ${rate}% combined sales tax rate (an illustrative rate). Enter your price and your local rate to update.`,
    results: salesTaxResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="tax-how-heading">
    <h2 id="tax-how-heading">How to calculate sales tax</h2>
    <ol>
      <li>Turn the rate into a decimal by dividing by 100: ${rate}% → ${rate / 100}.</li>
      <li>Multiply the price by it: ${formatCurrency(add.price)} × ${rate / 100} = $${add.exactTax.toFixed(3)}, which rounds to ${formatCurrency(add.tax)} of tax.</li>
      <li>Add the tax to the price: ${formatCurrency(add.price)} + ${formatCurrency(add.tax)} = ${formatCurrency(add.total)}.</li>
    </ol>
    <p class="formula"><code>Total = price × (1 + rate ÷ 100)</code></p>
  </section>

  <section class="content-section" aria-labelledby="tax-remove-heading">
    <h2 id="tax-remove-heading">How to take sales tax out of a total</h2>
    <p>Divide the total by 1 plus the rate as a decimal: ${formatCurrency(add.total)} ÷ ${(1 + rate / 100).toFixed(4)} = ${formatCurrency(remove.price)} before tax,
    so ${formatCurrency(remove.tax)} of the total was tax.</p>
    <p>A common mistake is to take ${rate}% of the total instead: ${formatCurrency(add.total)} × ${rate / 100} = ${formatCurrency(wrongTax)}, which overstates the
    tax by ${formatCurrency(wrongTax - remove.tax)}, because the tax was charged on the price, not on the total.</p>
  </section>

  <section class="content-section" aria-labelledby="tax-rate-heading">
    <h2 id="tax-rate-heading">How to find the sales tax rate from a receipt</h2>
    <p>Divide the tax by the price before tax and multiply by 100: ${formatCurrency(found.tax)} ÷ ${formatCurrency(found.price)} × 100 = ${found.ratePercent.toFixed(3)}%.
    Tax on a receipt is rounded to the cent, so the answer is only exact to within that rounding; the calculator shows the range of rates that fit.</p>
  </section>

  <section class="content-section" aria-labelledby="tax-table-heading">
    <h2 id="tax-table-heading">Sales tax on common amounts</h2>
    ${dataTable({
      id: 'tax-table',
      title: 'Sales tax by purchase amount and rate',
      columns: [{ key: 'amount', label: 'Price' }, ...TABLE_RATES.map((r) => ({ key: `r${r}`, label: `${r}%`, numeric: true }))],
      rows: TABLE_AMOUNTS.map((amount) => ({
        amount: formatCurrency(amount),
        ...Object.fromEntries(TABLE_RATES.map((r) => [`r${r}`, formatCurrency(addSalesTax({ price: amount, ratePercent: r }).tax)]))
      }))
    })}
  </section>

  <section class="content-section" aria-labelledby="tax-rates-heading">
    <h2 id="tax-rates-heading">Which rate to use</h2>
    <p>Sales tax is set by states and, in many places, by counties, cities and special districts as well, so the rate you pay is usually a combined
    rate that depends on where you buy or take delivery. What is taxed differs too: some states exempt or reduce the rate on items such as groceries
    or medicine, and a few states have no statewide sales tax. Your state's department of revenue publishes its rates and rules, and a receipt shows
    the rate a store charged.</p>
    <p>For a car, the price the tax is charged on can depend on state rules for trade-ins, rebates and fees; check with your state before relying on
    an estimate.</p>
  </section>

  <section class="content-section" aria-labelledby="tax-deduction-heading">
    <h2 id="tax-deduction-heading">Sales tax on your federal tax return</h2>
    <p>If you itemize deductions, you can choose to deduct the state and local general sales taxes you paid instead of state and local income taxes,
    but not both. You can use your actual receipts or the IRS's optional sales tax tables, and big purchases such as a car can matter
    (<a href="${SOURCES.irsSalesTaxDeduction.url}">IRS: Topic no. 503, deductible taxes</a>). Keep receipts that show the tax; the calculator's “find the rate” and
    “take tax out” modes help when a receipt shows only the total.</p>
  </section>

  <section class="content-section" aria-labelledby="tax-assumptions-heading">
    <h2 id="tax-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>One rate applies to the whole amount. Mixed baskets with exempt or reduced-rate items need each part calculated separately.</li>
      <li>Tax is rounded to the nearest cent, half up. Sellers may round per item or per receipt, so results can differ by a cent.</li>
      <li>This is an estimate of the tax on a purchase, not tax advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="tax-method-heading">
    <h2 id="tax-method-heading">Methodology and testing</h2>
    <p>Tax = price × rate; price = total ÷ (1 + rate); rate = tax ÷ price. Automated tests check hand-worked examples, rounding at half a cent,
    that adding tax and taking it back out returns the original price for thousands of random amounts and rates, and that the rate range always
    contains the true rate. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.irsSalesTaxDeduction])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/sales-tax.js']
  };
}

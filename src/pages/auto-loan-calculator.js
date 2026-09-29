/**
 * Auto Loan Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engines at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole, formatPercent, formatDuration } from '../lib/format.js';
import { autoLoanForm } from '../components/auto-loan-form.js';
import { autoLoanResults, autoQuickResult } from '../components/auto-loan-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { AUTO_DEFAULTS, parseAutoForm, buildAutoView } from '../adapters/auto-loan.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildAutoView(parseAutoForm({ ...AUTO_DEFAULTS, ...overrides }).input);
}

export function autoLoanPage() {
  const calculator = findCalculator('auto-loan-calculator');
  const example = exampleView();
  const { purchase } = example;

  // Negative-equity illustration: same purchase, trade-in worth $5,000 with $9,000 owed.
  const withNegative = exampleView({ tradeInValue: '5000', tradeInPayoff: '9000' });
  const negativeInterest = withNegative.totalInterest - example.totalInterest;

  // Budget mode: the same purchase terms, solved for price from a monthly budget.
  const budget = exampleView({ mode: 'budget' });
  const budget72 = exampleView({ mode: 'budget', termMonths: '72' });

  const shortest = example.termComparison[0];
  const longest = example.termComparison.at(-1);

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Estimate your car payment with sales tax, fees and a trade-in included, or start from a monthly budget to see how much car
  you can afford. See exactly how the amount you borrow is built, what the loan costs in interest, and how a different term or extra payments change it.</p>
</header>

${calculatorShell({
    inputsHeading: 'Purchase and loan details',
    form: autoLoanForm(AUTO_DEFAULTS, {}, autoQuickResult(example)),
    exampleNote: `Example: a ${formatCurrency(purchase.vehiclePrice)} car, ${formatCurrency(purchase.downPayment)} down, ${formatPercent(purchase.salesTaxRate)} sales tax, ${formatPercent(example.input.annualRate)} APR for ${example.input.termMonths} months. Enter your numbers to update.`,
    results: autoLoanResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="financed-how-heading">
    <h2 id="financed-how-heading">How the amount financed is calculated</h2>
    <p>Your loan covers whatever is left of the purchase after cash and trade-in equity:</p>
    <p class="formula"><code>Amount financed = price + sales tax + fees − down payment − (trade-in value − amount owed)</code></p>
    <p>In the example, ${formatCurrency(purchase.vehiclePrice)} + ${formatCurrency(purchase.salesTax)} tax − ${formatCurrency(purchase.downPayment)} down
    = <strong>${formatCurrency(purchase.amountFinanced)}</strong> financed. The monthly payment is then the standard fixed-rate loan payment on that amount:
    <strong>${formatCurrency(example.monthlyPayment)}</strong> for ${example.input.termMonths} months at ${formatPercent(example.input.annualRate)} APR.
    The same formula powers our <a href="/calculators/loan-payment-calculator/">loan payment calculator</a>.</p>
  </section>

  <section class="content-section" aria-labelledby="budget-heading">
    <h2 id="budget-heading">How much car can I afford on my budget?</h2>
    <p>Choose <strong>My monthly budget</strong> and the calculator works backwards: it finds the loan amount your payment supports at your APR and
    term, adds back your down payment and trade-in equity, and takes out fees and sales tax to leave the car price. With the example's
    ${formatCurrency(budget.budget.monthlyBudget)} a month, ${formatCurrency(purchase.downPayment)} down, ${formatPercent(purchase.salesTaxRate)} tax and
    ${formatPercent(example.input.annualRate)} APR over ${example.input.termMonths} months, that is about
    <strong>${formatCurrencyWhole(budget.budget.vehiclePrice)}</strong>.</p>
    <p>A longer term raises the price the same payment covers (about ${formatCurrencyWhole(budget72.budget.vehiclePrice)} over 72 months) but adds
    ${formatCurrency(budget72.totalInterest - budget.totalInterest)} of interest, and the loan can outlast the time you keep the car. The budget is the loan
    payment only: insurance, fuel, maintenance and registration come on top.</p>
  </section>

  <section class="content-section" aria-labelledby="tax-heading">
    <h2 id="tax-heading">Sales tax and trade-ins</h2>
    <p>Sales tax on a vehicle depends on your state and often your county or city. In some states, the value of your trade-in is
    subtracted from the price before tax is charged; in others, tax applies to the full price. The calculator does not assume either rule:
    tick <em>Trade-in value reduces the taxable price</em> if your state works that way. Your state's department of revenue or motor vehicle agency
    publishes the current rules and rates, and the buyer's order from the dealer shows the tax actually charged.</p>
    <p>Fees are treated as untaxed amounts added to the loan. If you pay fees in cash instead, leave them out and they will not be financed.</p>
  </section>

  <section class="content-section" aria-labelledby="negative-equity-heading">
    <h2 id="negative-equity-heading">What negative equity costs</h2>
    <p>If you owe more on your current car than it is worth, the difference does not disappear when you trade it in.
    A dealer or lender may roll it into the new loan, which makes that loan more expensive
    (<a href="${SOURCES.tradeInNegativeEquity.url}">CFPB: trading in a car that is not paid off</a>). For example, trading in a car worth $5,000 with $9,000 still owed adds
    ${formatCurrency(withNegative.purchase.amountFinanced - purchase.amountFinanced)} to the example loan. That raises the payment to
    ${formatCurrency(withNegative.monthlyPayment)} and adds ${formatCurrency(negativeInterest)} of interest over the term.
    Paying the gap in cash, or waiting until the old loan balance is below the car's value, avoids this.</p>
  </section>

  <section class="content-section" aria-labelledby="term-choice-heading">
    <h2 id="term-choice-heading">Choosing a loan term</h2>
    <p>For the example car, a ${formatDuration(shortest.termMonths)} loan costs ${formatCurrency(shortest.monthlyPayment)} a month and
    ${formatCurrency(shortest.totalInterest)} in interest; stretching it to ${formatDuration(longest.termMonths)} lowers the payment to
    ${formatCurrency(longest.monthlyPayment)} but raises interest to ${formatCurrency(longest.totalInterest)}.
    Longer terms also pay down the balance more slowly, so for longer you may owe more than the car would sell for.
    The comparison keeps your APR fixed; a lender may quote a different rate for a different term, so compare actual quotes.</p>
  </section>

  <section class="content-section" aria-labelledby="extra-auto-heading">
    <h2 id="extra-auto-heading">Paying extra</h2>
    <p>The extra monthly amount is applied to principal from the first payment, so the loan ends early and total interest falls.
    Whether you can pay early without a penalty depends on your contract and state law; your Truth in Lending disclosure says whether a
    prepayment penalty applies (<a href="${SOURCES.prepayment.url}">CFPB: prepaying a loan</a>). Ask your lender how extra payments are applied.</p>
  </section>

  <section class="content-section" aria-labelledby="auto-assumptions-heading">
    <h2 id="auto-assumptions-heading">Assumptions and limitations</h2>
    <ul>
      <li>Fixed APR and equal monthly payments; monthly interest is the APR divided by 12 on the remaining balance.</li>
      <li>Sales tax applies to the vehicle price (or price minus trade-in if you choose); fees are not taxed.</li>
      <li>Manufacturer rebates, dealer add-ons, service contracts, GAP coverage and insurance are not modeled. Add any you are financing to the fees field.</li>
      <li>No tax rates, fees or APRs are assumed for any state or lender. Use the figures from your own quote.</li>
      <li>Amounts are calculated at full precision and rounded to cents for display, so a lender's figures may differ slightly.</li>
      <li>Results are estimates, not a loan offer, approval or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="auto-method-heading">
    <h2 id="auto-method-heading">Methodology and testing</h2>
    <p>The auto-loan engine turns the purchase into an amount financed and then uses the same tested amortization engine as our
    loan payment calculator. Automated tests cover trade-in equity and negative equity, both sales-tax treatments, fees, down payments
    that also cover tax and fees, term comparisons and invalid inputs, and are checked against independent calculations.
    Your inputs stay in your browser. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.tradeInNegativeEquity, SOURCES.prepayment])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/auto-loan.js']
  };
}

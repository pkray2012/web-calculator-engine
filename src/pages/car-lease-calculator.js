/**
 * Car Lease Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../lib/format.js';
import { carLeaseForm } from '../components/car-lease-form.js';
import { carLeaseResults, carLeaseQuickResult } from '../components/car-lease-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { LEASE_DEFAULTS, parseLeaseForm, buildLeaseView } from '../adapters/car-lease.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildLeaseView(parseLeaseForm({ ...LEASE_DEFAULTS, ...overrides }).input);
}

export function carLeasePage() {
  const calculator = findCalculator('car-lease-calculator');
  const example = exampleView();
  const { input, lease } = example;
  const lowResidual = exampleView({ residualPercent: '50' });
  const higherRate = exampleView({ leaseApr: '9' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Estimate a car lease payment from the price, residual value and money factor, see what is due at signing and what the lease costs
  in total, and compare it with buying the same car with a loan. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your lease and loan details',
    form: carLeaseForm(LEASE_DEFAULTS, {}, carLeaseQuickResult(example)),
    exampleNote: `Example: a ${formatCurrencyWhole(input.msrp)} MSRP car negotiated to ${formatCurrencyWhole(input.price)}, ${formatPercent(input.residualPercent, 0)} residual, a ${formatPercent(input.leaseApr)} lease rate for ${input.leaseMonths} months and ${formatCurrencyWhole(input.downPayment)} down, compared with a ${formatPercent(input.loanApr)} loan over ${input.loanMonths} months (illustrative figures, not a quote). Enter your numbers to update.`,
    results: carLeaseResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="lease-how-heading">
    <h2 id="lease-how-heading">How a lease payment is calculated</h2>
    <p>Most of a lease payment covers the car's expected loss in value over the lease; the rest is a rent charge for the money tied up in the car, plus
    tax and fees (<a href="${SOURCES.leaseVsBuy.url}">CFPB: leasing versus buying</a>).</p>
    <ol>
      <li><strong>Adjusted capitalized cost</strong> = negotiated price + fees added to the lease − down payment − trade-in equity:
      ${formatCurrency(lease.adjustedCapCost)} in the example.</li>
      <li><strong>Residual value</strong> = MSRP × residual %: ${formatCurrency(lease.residual)}.</li>
      <li><strong>Depreciation</strong> = (adjusted cap cost − residual) ÷ months = ${formatCurrency(lease.depreciation)} a month.</li>
      <li><strong>Rent charge</strong> = (adjusted cap cost + residual) × money factor = ${formatCurrency(lease.rentCharge)} a month. The money factor is the
      rate ÷ 2,400, so ${formatPercent(input.leaseApr)} is ${lease.moneyFactor.toFixed(5)}.</li>
      <li><strong>Payment</strong> = depreciation + rent charge, plus sales tax where your state taxes lease payments: ${formatCurrency(lease.payment)}.</li>
    </ol>
  </section>

  <section class="content-section" aria-labelledby="lease-levers-heading">
    <h2 id="lease-levers-heading">What moves the payment</h2>
    <ul>
      <li><strong>Residual value:</strong> at ${formatPercent(lowResidual.input.residualPercent, 0)} instead of ${formatPercent(input.residualPercent, 0)}, the payment
      rises to ${formatCurrency(lowResidual.lease.payment)}, because you pay for more of the car's value.</li>
      <li><strong>Money factor:</strong> a ${formatPercent(higherRate.input.leaseApr)} rate instead of ${formatPercent(input.leaseApr)} makes it
      ${formatCurrency(higherRate.lease.payment)}. Ask for the money factor and convert it to an APR to compare it with loan offers.</li>
      <li><strong>Price:</strong> the price of a leased car is negotiable, like a purchase price, and every dollar off lowers depreciation.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="lease-buy-heading">
    <h2 id="lease-buy-heading">Leasing versus buying</h2>
    <p>Lease payments are usually lower than loan payments, but at the end of a lease you return the car and own nothing, while a loan builds equity.
    To compare them fairly, the calculator counts the buyer's equity when the lease would end, assuming the car is then worth its residual value. In the
    example, over ${input.leaseMonths} months ${example.leaseCheaper ? 'leasing' : 'buying'} costs about ${formatCurrencyWhole(Math.abs(example.leaseMinusBuy))} less; at a
    ${formatPercent(higherRate.input.leaseApr)} lease rate, ${higherRate.leaseCheaper ? 'leasing' : 'buying'} costs about ${formatCurrencyWhole(Math.abs(higherRate.leaseMinusBuy))} less.
    Keeping a car well beyond the loan term usually favors buying. Our <a href="/calculators/auto-loan-calculator/">auto loan calculator</a> shows the
    full loan in detail.</p>
  </section>

  <section class="content-section" aria-labelledby="lease-assumptions-heading">
    <h2 id="lease-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Excess mileage and wear-and-tear charges, disposition fees at lease end, and early termination costs. Check your lease's mileage limit.</li>
      <li>State-specific lease taxes other than a tax on each payment, and differences in insurance or maintenance.</li>
      <li>The car's actual value at lease end, which can be above or below the residual.</li>
    </ul>
    <p>Results are estimates, not an offer. Your lease disclosure lists the actual amounts.</p>
  </section>

  <section class="content-section" aria-labelledby="lease-method-heading">
    <h2 id="lease-method-heading">Methodology and testing</h2>
    <p>The loan side uses the same tested engine as our auto loan calculator. Automated tests compare the lease payment, total cost and lease-vs-buy
    result with an independent implementation. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.leaseVsBuy])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/car-lease.js']
  };
}

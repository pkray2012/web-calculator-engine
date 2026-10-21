/**
 * Solar Financing Calculator page (draft, Home Energy Batch 1). Not imported
 * by scripts/build.js until the owner releases it. Every figure in the copy
 * is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { financingForm } from '../../components/energy/solar-financing-form.js';
import { financingResults, financingQuickResult } from '../../components/energy/solar-financing-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { FINANCING_DEFAULTS, runFinancingCalculator } from '../../adapters/energy/solar-financing.js';
import { findEnergyCalculator, relatedEnergyCalculators } from '../../content/energy-batch1.js';
import { findCalculator } from '../../content/site.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

export function solarFinancingPage() {
  const calculator = findEnergyCalculator('solar-financing-calculator');
  const loanPage = findCalculator('loan-payment-calculator');
  const example = runFinancingCalculator(FINANCING_DEFAULTS).view;
  const { input, result } = example;
  const price = formatCurrency(input.priceCents / 100).replace('.00', '');
  const payment = formatCurrency(result.payment);
  const interest = formatCurrency(result.interest);
  const rebate = runFinancingCalculator({ ...FINANCING_DEFAULTS, price: '21000', purchaseRebates: '1000' }).view.result;
  const later = runFinancingCalculator({ ...FINANCING_DEFAULTS, laterRebates: '1000' }).view.result;
  const fees = runFinancingCalculator({ ...FINANCING_DEFAULTS, fees: '500' }).view.result;
  const apr = ENERGY_SOURCES.aprVsRate;

  const faqs = [
    {
      question: 'Should I use the APR or the interest rate?',
      answer: 'Use the interest rate on your loan agreement. The APR adds fees such as origination charges to the rate, so it is usually higher (Consumer Financial Protection Bureau). If your loan has no fees, they are the same.'
    },
    {
      question: 'Do rebates lower my loan?',
      answer: `Only rebates applied at purchase. A ${formatCurrency(21000).replace('.00', '')} system with a $1,000 rebate at purchase borrows ${formatCurrency(rebate.loan).replace('.00', '')}, at ${formatCurrency(rebate.payment)} a month. A $1,000 rebate received later leaves the loan and payment unchanged (${formatCurrency(later.payment)}); it only lowers your net cost, unless you use it to pay the loan down.`
    },
    {
      question: 'What does the solar loan cost in total?',
      answer: `Add the down payment and every loan payment. With no down payment, ${price} at ${input.annualRate}% over ${input.termMonths} months costs ${formatCurrency(result.financingOutlay)} in total, of which ${interest} is interest. That is more than the net installed price of ${formatCurrency(result.netInstalledPrice).replace('.00', '')}.`
    },
    {
      question: 'Is it cheaper to pay cash or take a loan?',
      answer: `Compared with paying cash, the loan costs the interest plus any fees you add to it. Adding $500 of fees to the example loan raises the interest to ${formatCurrency(fees.interest)}, so borrowing costs ${formatCurrency(fees.interest + 500)} more than paying cash.`
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>A solar loan payment uses the loan interest rate (not the APR) and the amount financed.</strong>
  ${price} at ${input.annualRate}% for ${input.termMonths} months is ${payment} a month, with ${interest} of interest.`)}
  <p class="lede">Estimate a solar loan's monthly payment and total cost from the system price, down payment, rebates, interest rate, term and any fees added to the loan.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your system and loan',
    form: financingForm(FINANCING_DEFAULTS, {}, financingQuickResult(example)),
    exampleNote: `Example: ${price} at ${input.annualRate}% for ${input.termMonths} months (illustrative values, not a typical rate). Enter your quote and loan to update.`,
    results: financingResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="fin-how-heading">
    <h2 id="fin-how-heading">How a solar loan payment is worked out</h2>
    <ol>
      <li><strong>Amount financed:</strong> price − rebates at purchase − down payment + fees added to the loan.</li>
      <li><strong>Monthly payment:</strong> the standard fixed-rate formula, with the monthly rate r = annual rate ÷ 12 and n monthly payments.</li>
      <li><strong>Interest:</strong> each month's interest is the balance × r; the total interest is their sum. In the example, ${interest}.</li>
    </ol>
    <p class="formula"><code>Payment = amount financed × r ÷ (1 − (1 + r)<sup>−n</sup>)</code></p>
    <p>The same loan arithmetic is used by our <a href="${loanPage.path}">${loanPage.name}</a>.</p>
  </section>

  <section class="content-section" aria-labelledby="fin-assumptions-heading">
    <h2 id="fin-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>A fixed-rate loan with equal monthly payments. Rates up to 25% and terms up to 30 years (360 months) are supported.</li>
      <li>Rebates received later don't reduce the loan unless you use them to pay it down; they only lower the net cost.</li>
      <li>Tax credits are not calculated. Amounts financed under $100, or payments under $1 a month, are too small to model.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="fin-method-heading">
    <h2 id="fin-method-heading">Methodology and testing</h2>
    <p>Amounts are converted to whole cents. After building the schedule, the calculator checks that every payment is made, the balance reaches zero,
    the principal and totals add up and the interest equals the payments minus the amount financed, each to under half a cent; inputs that fail are rejected
    rather than shown. Automated tests check the worked examples, 0% loans, rebates, fees and the limits. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'fin-faq')}

  ${sourcesSection([apr])}

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
    scripts: ['client/energy/solar-financing.js']
  };
}

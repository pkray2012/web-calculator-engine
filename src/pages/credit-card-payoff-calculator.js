/**
 * Credit Card Payoff Calculator page. Example results and every worked figure
 * in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { creditCardForm } from '../components/credit-card-form.js';
import { creditCardResults, creditCardQuickResult } from '../components/credit-card-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { CARD_DEFAULTS, parseCardForm, buildCardView } from '../adapters/credit-card-payoff.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildCardView(parseCardForm({ ...CARD_DEFAULTS, ...overrides }).input);
}

export function creditCardPayoffPage() {
  const calculator = findCalculator('credit-card-payoff-calculator');
  const example = exampleView();
  const { input } = example;
  const smaller = exampleView({ monthlyPayment: '150' });
  const withExtra = exampleView({ extraMonthly: '100' });
  const twoYears = exampleView({ mode: 'target', targetMonths: '24' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Find out how long it will take to pay off a credit card, how much interest it will cost, and what you would
  need to pay each month to be debt-free by a date you choose, with a month-by-month payoff schedule.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your card',
    form: creditCardForm(CARD_DEFAULTS, {}, creditCardQuickResult(example)),
    exampleNote: `Example: a ${formatCurrency(input.principal)} balance at ${formatPercent(input.annualRate)} APR, paying ${formatCurrency(example.monthlyPayment)} a month. Enter your card to update.`,
    results: creditCardResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="cc-how-heading">
    <h2 id="cc-how-heading">How the payoff is calculated</h2>
    <p>Each month, interest is added to the balance at the APR divided by 12, and then your payment is subtracted. What is left
    over after interest is what actually reduces the debt. In the example, the first month's interest on ${formatCurrency(input.principal)} at
    ${formatPercent(input.annualRate)} is ${formatCurrency(example.card.firstMonthInterest)}, so only
    ${formatCurrency(example.monthlyPayment - example.card.firstMonthInterest)} of the ${formatCurrency(example.monthlyPayment)} payment goes toward the balance.
    As the balance falls, more of each payment goes to principal. At that payment the card is paid off in
    <strong>${formatDuration(example.payments)}</strong> with <strong>${formatCurrency(example.totalInterest)}</strong> of interest.</p>
  </section>

  <section class="content-section" aria-labelledby="cc-small-heading">
    <h2 id="cc-small-heading">Why small payments take so long</h2>
    <p>Lowering the payment to ${formatCurrency(smaller.monthlyPayment)} stretches the same balance to ${formatDuration(smaller.payments)}
    and ${formatCurrency(smaller.totalInterest)} of interest, because far less of each payment is left after interest.
    If a payment does not cover the month's interest, the balance never goes down.</p>
    <p>Card issuers set their own minimum-payment formulas, and a minimum often falls as the balance falls, which stretches payoff further.
    Your statement's minimum payment warning shows how long paying only the minimum would take and, when that is more than three years,
    the monthly payment that would pay off the balance in three years (<a href="${SOURCES.minimumPaymentBox.url}">CFPB: the repayment box on your bill</a>).
    To compare, enter your current minimum as the monthly payment (the calculator keeps it fixed), or choose a set time of 36 months.</p>
  </section>

  <section class="content-section" aria-labelledby="cc-extra-heading">
    <h2 id="cc-extra-heading">What paying extra does</h2>
    <p>Adding ${formatCurrency(withExtra.extra.amount)} a month to the example payment clears the card in ${formatDuration(withExtra.extra.payments)}
    instead of ${formatDuration(withExtra.payments)} and saves ${formatCurrency(withExtra.extra.interestSaved)} in interest. Every extra dollar goes
    straight to the balance, so it also lowers the interest charged in every later month.</p>
  </section>

  <section class="content-section" aria-labelledby="cc-target-heading">
    <h2 id="cc-target-heading">Planning a debt-free date</h2>
    <p>Choose <em>I want to be debt-free by a set time</em> to work backward: the calculator finds the fixed monthly payment that clears the
    balance in exactly that many months. For the example card, being debt-free in ${formatDuration(twoYears.payments)} takes
    ${formatCurrency(twoYears.monthlyPayment)} a month and ${formatCurrency(twoYears.totalInterest)} of interest. The comparison table shows
    the payment needed for other dates.</p>
    <p>If you are considering moving the balance to a loan, compare its true cost with our
    <a href="/calculators/personal-loan-calculator/">personal loan calculator</a>, which accounts for origination fees.</p>
  </section>

  <section class="content-section" aria-labelledby="cc-assumptions-heading">
    <h2 id="cc-assumptions-heading">Assumptions and limitations</h2>
    <ul>
      <li>Interest is charged monthly at the APR divided by 12 on the balance. Many issuers charge a daily periodic rate on your
      average daily balance instead (<a href="${SOURCES.cardInterest.url}">CFPB: how card interest is calculated</a>), so your actual interest can differ slightly.</li>
      <li>No new purchases, cash advances, fees or penalty rates are added, and the APR stays the same.</li>
      <li>Promotional rates, balance-transfer offers and issuer minimum-payment formulas are not modeled.</li>
      <li>Your payment is the same every month and is applied to this balance.</li>
      <li>Results are estimates, not financial advice. Your card issuer's statement is the authoritative record.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="cc-method-heading">
    <h2 id="cc-method-heading">Methodology and testing</h2>
    <p>The payoff engine simulates the balance month by month. For a target date it solves the payment with the same tested formula as our
    <a href="/calculators/loan-payment-calculator/">loan payment calculator</a>. Automated tests check payoff time against the closed-form
    formula, interest against an independent simulation, and that every target date is met exactly, across balances, APRs and terms.
    Your inputs stay in your browser. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.cardInterest, SOURCES.minimumPaymentBox, SOURCES.periodicStatementRule])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/credit-card-payoff.js']
  };
}

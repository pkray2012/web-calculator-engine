/**
 * Loan Payoff Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { loanPayoffForm } from '../components/loan-payoff-form.js';
import { loanPayoffResults, loanPayoffQuickResult } from '../components/loan-payoff-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { PAYOFF_DEFAULTS, parsePayoffForm, buildPayoffView } from '../adapters/loan-payoff.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildPayoffView(parsePayoffForm({ ...PAYOFF_DEFAULTS, ...overrides }).input);
}

export function loanPayoffPage() {
  const calculator = findCalculator('loan-payoff-calculator');
  const example = exampleView();
  const { input } = example;
  const lumpEarly = exampleView({ extraMonthly: '', lumpSum: '10000', lumpSumMonth: '1' });
  const lumpLate = exampleView({ extraMonthly: '', lumpSum: '10000', lumpSumMonth: '181' });
  const yearly = exampleView({ extraMonthly: '', extraYearly: String(input.extraMonthly * 12) });
  const target = exampleView({ mode: 'target', targetYears: '15' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Start from your loan as it is today and see how much sooner extra payments pay it off and how much interest they save, or find the extra
  you need each month to be debt-free by a set time. Works for mortgages, auto loans and other fixed-rate loans. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your loan and your plan',
    form: loanPayoffForm(PAYOFF_DEFAULTS, {}, loanPayoffQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.balance)} owed at ${formatPercent(input.annualRate)}, paying ${formatCurrency(input.payment)} a month plus ${formatCurrency(input.extraMonthly)} extra. Enter your numbers to update.`,
    results: loanPayoffResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="why-heading">
    <h2 id="why-heading">Why extra payments save so much</h2>
    <p>Each month's interest is charged on the balance you still owe. An extra payment that goes to principal lowers that balance, so every later payment
    carries less interest and more of it pays down the loan. In the example, ${formatCurrency(input.extraMonthly)} extra a month pays the loan off
    ${formatDuration(example.monthsSaved)} sooner and saves ${formatCurrency(example.interestSaved)} of interest.</p>
  </section>

  <section class="content-section" aria-labelledby="timing-heading">
    <h2 id="timing-heading">Earlier extra payments save more</h2>
    <p>A one-time ${formatCurrency(lumpEarly.input.lumpSum)} extra payment made with your next payment saves ${formatCurrency(lumpEarly.interestSaved)} of interest
    and ${formatDuration(lumpEarly.monthsSaved)} on the example loan. The same amount paid ${formatDuration(lumpLate.input.lumpSumMonth - 1)} later saves
    ${formatCurrency(lumpLate.interestSaved)}, because it has less time to cut interest. Paying ${formatCurrency(yearly.input.extraYearly)} once a year instead of
    ${formatCurrency(input.extraMonthly)} every month saves ${formatCurrency(yearly.interestSaved)} rather than ${formatCurrency(example.interestSaved)}: the same yearly
    total, but most of it arrives later.</p>
  </section>

  <section class="content-section" aria-labelledby="target-heading">
    <h2 id="target-heading">Pay off by a set date</h2>
    <p>Choose "How much extra to be debt-free by a set time" to solve for the extra monthly payment. To pay off the example loan in
    ${formatDuration(target.target.months)}, you would add ${formatCurrency(target.target.extraMonthly)} a month, saving ${formatCurrency(target.interestSaved)}
    of interest. Any yearly or one-time extras you enter are counted first, which lowers the monthly extra needed.</p>
  </section>

  <section class="content-section" aria-labelledby="lender-heading">
    <h2 id="lender-heading">Before you pay extra</h2>
    <ul>
      <li>Check whether your loan has a prepayment penalty. Your contract and Truth in Lending disclosure say whether one applies
      (<a href="${SOURCES.prepayment.url}">CFPB: prepayment penalties</a>).</li>
      <li>Ask your servicer to apply extra payments to principal, not to future payments. Otherwise they may not reduce interest.</li>
      <li>Extra payments shorten the loan; they do not lower the required monthly payment unless the lender recasts the loan.</li>
      <li>Money used to pay extra is not available for emergencies or other goals, and paying off a low-rate loan early may save less than other uses of the money.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="payoff-how-heading">
    <h2 id="payoff-how-heading">How the payoff is calculated</h2>
    <ol>
      <li>Each month, interest is the balance × annual rate ÷ 12. Your regular payment covers that interest first; the rest reduces the balance.</li>
      <li>Extra payments (monthly, every 12th payment, or once with the payment you choose) then go entirely to principal, never more than you owe.</li>
      <li>This repeats until the balance reaches zero; the last payment is only what is left.</li>
      <li>For a payoff time, the extra monthly amount is solved exactly: without other extras it is the fixed-rate payment for that time minus your current
      payment; with yearly or one-time extras it is found by testing ever-closer amounts.</li>
    </ol>
    <p>Enter principal and interest only. If your mortgage payment includes escrow for taxes and insurance, leave that part out. Results are estimates, not a payoff
    quote; ask your lender for an exact payoff amount.</p>
  </section>

  <section class="content-section" aria-labelledby="payoff-method-heading">
    <h2 id="payoff-method-heading">Methodology and testing</h2>
    <p>Automated tests check the payoff time against the closed-form formula, the interest against an independent month-by-month simulation for 300 random loans
    and plans, and that the solved extra payment pays off on time while a cent less does not. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.prepayment])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/loan-payoff.js']
  };
}

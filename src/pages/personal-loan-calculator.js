/**
 * Personal Loan Calculator page. Example results and every worked figure in
 * the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { personalLoanForm } from '../components/personal-loan-form.js';
import { personalLoanResults, personalQuickResult } from '../components/personal-loan-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { PERSONAL_DEFAULTS, parsePersonalForm, buildPersonalView } from '../adapters/personal-loan.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';
import { faqSection, faqStructuredData, directAnswer } from '../components/faq.js';

function exampleView(overrides = {}) {
  return buildPersonalView(parsePersonalForm({ ...PERSONAL_DEFAULTS, ...overrides }).input);
}

export function personalLoanPage() {
  const calculator = findCalculator('personal-loan-calculator');
  const example = exampleView();
  const { fee, input } = example;
  const years = input.termMonths / 12;

  // Two illustrative offers for the same amount and term (not market rates).
  const offerA = exampleView({ annualRate: '11', originationFeeRate: '6' });
  const offerB = exampleView({ annualRate: '13', originationFeeRate: '0' });
  const cheaper = offerA.fee.costOfBorrowing < offerB.fee.costOfBorrowing ? 'A' : 'B';

  const shortTerm = example.termComparison[0];
  const longTerm = example.termComparison.at(-1);

  // Direct answer and FAQ figures, all from the engine.
  const faqs = [
    { question: 'How is a personal loan payment calculated?', answer: `Payment = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r is the annual rate ÷ 12 and n is the number of monthly payments. ${formatCurrency(input.principal)} at ${formatPercent(input.annualRate)} for ${years} years is ${formatCurrency(example.monthlyPayment)} a month.` },
    { question: 'How much will I receive after an origination fee?', answer: `The fee is withheld from the loan, so you receive the loan amount minus the fee. A ${formatPercent(fee.rate)} fee on ${formatCurrency(input.principal)} withholds ${formatCurrency(fee.amount)}, so you receive ${formatCurrency(fee.amountReceived)} but repay the full ${formatCurrency(input.principal)} with interest.` },
    { question: 'What is the total cost of a personal loan?', answer: `Interest plus fees. In the example you pay ${formatCurrency(example.totalInterest)} of interest and a ${formatCurrency(fee.amount)} fee, a cost of borrowing of ${formatCurrency(fee.costOfBorrowing)}.` },
    { question: 'Why is the APR higher than the interest rate?', answer: `The APR counts fees as well as interest. Because you receive only ${formatCurrency(fee.amountReceived)}, the example's fee-adjusted APR is ${formatPercent(fee.effectiveAPR, 2)} against a ${formatPercent(input.annualRate)} rate. With no fee the two are equal.` },
    { question: 'Is a lower rate with a fee better than a higher rate with none?', answer: `Not always. For ${formatCurrency(input.principal)} over ${years} years, 11% with a 6% fee costs ${formatCurrency(offerA.fee.costOfBorrowing)} and 13% with no fee costs ${formatCurrency(offerB.fee.costOfBorrowing)} (illustrative rates). Compare the cash you receive, the APR and the total cost, not the rate alone.` },
    { question: 'Does a longer term lower the cost?', answer: `It lowers the payment but usually raises total interest. At the example rate, a ${shortTerm.termMonths}-month loan costs ${formatCurrency(shortTerm.monthlyPayment)} a month and ${formatCurrency(shortTerm.totalInterest)} of interest; an ${longTerm.termMonths}-month loan costs ${formatCurrency(longTerm.monthlyPayment)} a month and ${formatCurrency(longTerm.totalInterest)} of interest.` }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Payment = P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</strong>, with r = annual rate ÷ 12 and n = months.
  ${formatCurrency(input.principal)} at ${formatPercent(input.annualRate)} for ${years} years is ${formatCurrency(example.monthlyPayment)} a month; after a
  ${formatPercent(fee.rate)} origination fee you receive ${formatCurrency(fee.amountReceived)}.`)}
  <p class="lede">See the monthly payment on a personal loan, how much cash you actually receive after an origination fee,
  and what the loan really costs once that fee is counted, with a fee-adjusted APR, term comparison and full schedule.</p>
</header>

${calculatorShell({
    inputsHeading: 'Loan details',
    form: personalLoanForm(PERSONAL_DEFAULTS, {}, personalQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.principal)} with a ${formatPercent(fee.rate)} origination fee at ${formatPercent(input.annualRate)} for ${years} years. Enter your loan offer to update.`,
    results: personalLoanResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="fee-how-heading">
    <h2 id="fee-how-heading">How origination fees change what you receive</h2>
    <p>Many personal loans charge an origination fee, a percentage of the loan withheld when the loan is funded.
    You repay the full loan amount with interest, but receive less cash. In the example, a ${formatPercent(fee.rate)} fee on
    ${formatCurrency(input.principal)} withholds ${formatCurrency(fee.amount)}, so you receive <strong>${formatCurrency(fee.amountReceived)}</strong>
    while paying <strong>${formatCurrency(example.monthlyPayment)}</strong> a month on the full ${formatCurrency(input.principal)}.</p>
    <p>If you need a specific amount of cash, borrow enough that the amount left after the fee covers it. Enter a larger loan amount
    and check the <em>Cash you receive</em> figure.</p>
  </section>

  <section class="content-section" aria-labelledby="payment-how-heading">
    <h2 id="payment-how-heading">How the payment is calculated</h2>
    <p>The monthly payment is the standard fixed-rate loan payment on the full loan amount, using the interest rate divided by 12 as the
    monthly rate: <code>P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</code>. It is the same tested formula behind our
    <a href="/calculators/loan-payment-calculator/">loan payment calculator</a>. Over ${input.termMonths} payments the example repays
    ${formatCurrency(fee.totalRepaid)}: ${formatCurrency(example.totalInterest)} of interest plus the ${formatCurrency(input.principal)} borrowed.</p>
  </section>

  <section class="content-section" aria-labelledby="apr-heading">
    <h2 id="apr-heading">What the fee-adjusted APR means</h2>
    <p>The fee-adjusted APR is the yearly rate that makes the cash you receive equal to the value of all your scheduled payments.
    It is found by solving for the monthly rate that discounts the payments back to ${formatCurrency(fee.amountReceived)} and multiplying by 12.
    For the example that is <strong>${formatPercent(fee.effectiveAPR, 2)}</strong>, compared with the ${formatPercent(input.annualRate)} interest rate.
    With no fee, the two are equal.</p>
    <p>Lenders' APRs work the same way: the APR includes the interest rate plus fees such as origination charges, which is why it is usually higher than the
    rate (<a href="${SOURCES.aprVsRate.url}">CFPB: interest rate vs. APR</a>). This calculator's figure is an estimate for comparing offers. The APR on your
    lender's Truth in Lending disclosure is the official figure and can differ if other finance charges apply or payments are timed differently.</p>
  </section>

  <section class="content-section" aria-labelledby="fee-term-heading">
    <h2 id="fee-term-heading">Why a fee costs more on a short loan or early payoff</h2>
    <p>A fee is charged once, so its cost per year depends on how long you keep the loan. For the example amount, fee and rate, the fee-adjusted APR is
    ${formatPercent(shortTerm.effectiveAPR, 2)} over ${formatDuration(shortTerm.termMonths)} but ${formatPercent(longTerm.effectiveAPR, 2)} over
    ${formatDuration(longTerm.termMonths)}, even though the longer loan costs more in total interest. Paying the loan off early works the same way:
    you save interest, but a withheld fee is not refunded, so its effective rate rises. The extra-payment section shows both effects.</p>
  </section>

  <section class="content-section" aria-labelledby="compare-heading">
    <h2 id="compare-heading">Comparing offers: rate vs. fee</h2>
    <p>A lower rate with a fee is not always cheaper than a higher rate with none. For example, for ${formatCurrency(input.principal)} over ${years} years
    (illustrative numbers, not current market rates):</p>
    <ul>
      <li><strong>Offer A:</strong> 11% with a 6% fee: you receive ${formatCurrency(offerA.fee.amountReceived)}, pay ${formatCurrency(offerA.monthlyPayment)} a month,
      and the cost of borrowing is ${formatCurrency(offerA.fee.costOfBorrowing)} (fee-adjusted APR ${formatPercent(offerA.fee.effectiveAPR, 2)}).</li>
      <li><strong>Offer B:</strong> 13% with no fee: you receive ${formatCurrency(offerB.fee.amountReceived)}, pay ${formatCurrency(offerB.monthlyPayment)} a month,
      and the cost of borrowing is ${formatCurrency(offerB.fee.costOfBorrowing)} (APR ${formatPercent(offerB.fee.effectiveAPR, 2)}).</li>
    </ul>
    <p>Here offer ${cheaper} costs less in total${cheaper === 'B' ? ' despite its higher rate, and it also gives you more cash' : ', though it leaves you with less cash'}.
    Compare offers on the cash you receive, the fee-adjusted APR and the cost of borrowing, not the interest rate alone.</p>
    <p>If the loan would pay off credit card balances, the <a href="/calculators/credit-card-payoff-calculator/">credit card payoff calculator</a>
    shows how long the cards would take to clear, and what they would cost in interest, at a payment you can afford, so you can compare both routes.</p>
  </section>

  <section class="content-section" aria-labelledby="personal-assumptions-heading">
    <h2 id="personal-assumptions-heading">Assumptions and limitations</h2>
    <ul>
      <li>Fixed interest rate and equal monthly payments; monthly interest is the annual rate divided by 12 on the remaining balance.</li>
      <li>The origination fee is a percentage withheld from the loan proceeds and is not refunded on early payoff.</li>
      <li>The fee-adjusted APR uses the scheduled payments and is an estimate, not a Truth in Lending disclosure.</li>
      <li>Late fees, returned-payment fees and optional insurance products are not included.</li>
      <li>No rates or fees are assumed for any lender or credit profile. Use the figures from your own offer.</li>
      <li>Amounts are calculated at full precision and rounded to cents for display. Results are estimates, not a loan offer, approval or financial advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="personal-method-heading">
    <h2 id="personal-method-heading">Methodology and testing</h2>
    <p>The personal-loan engine uses the same tested amortization engine as our other loan calculators and adds the origination fee and
    a fee-adjusted APR solver. Automated tests check the payment, cash received, cost of borrowing and fee-adjusted APR against independent
    calculations, including zero fees, zero interest, extra payments and invalid inputs. Your inputs stay in your browser.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'personal-faq')}

  ${sourcesSection([SOURCES.aprVsRate])}

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
    scripts: ['client/personal-loan.js']
  };
}

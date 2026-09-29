/**
 * Balance Transfer Calculator page. Example results and every worked figure
 * in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration, formatPercent } from '../lib/format.js';
import { balanceTransferForm } from '../components/balance-transfer-form.js';
import { balanceTransferResults, balanceTransferQuickResult } from '../components/balance-transfer-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { TRANSFER_DEFAULTS, parseTransferForm, buildTransferView } from '../adapters/balance-transfer.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildTransferView(parseTransferForm({ ...TRANSFER_DEFAULTS, ...overrides }).input);
}

export function balanceTransferPage() {
  const calculator = findCalculator('balance-transfer-calculator');
  const example = exampleView();
  const { input } = example;
  const clearing = exampleView({ monthlyPayment: String(Math.ceil(example.paymentToClearDuringPromo)) });
  const shortPromo = exampleView({ balance: '2000', currentApr: '18', monthlyPayment: '500', transferFee: '5', introMonths: '6', postIntroApr: '24.99' });
  const introRate = exampleView({ introApr: '2.99' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Find out whether moving a credit card balance to a lower-rate card saves money once the transfer fee is counted, how much will still be owed
  when the intro rate ends, and the monthly payment that clears it in time. For anyone weighing a balance transfer offer. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your card and the offer',
    form: balanceTransferForm(TRANSFER_DEFAULTS, {}, balanceTransferQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.balance)} at ${formatPercent(input.currentApr)} APR, paying ${formatCurrency(input.monthlyPayment)} a month, moved to a ${formatPercent(input.introApr, 0)} offer for ${input.introMonths} months with a ${formatPercent(input.transferFeePercent, 0)} fee and ${formatPercent(input.postIntroApr)} afterwards (illustrative terms). Enter your offer to update.`,
    results: balanceTransferResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="bt-how-heading">
    <h2 id="bt-how-heading">How the comparison works</h2>
    <ol>
      <li><strong>Keep the card:</strong> each month, interest of APR ÷ 12 is added to the balance and your payment is subtracted, until it is paid off.
      The same method as our <a href="/calculators/credit-card-payoff-calculator/">credit card payoff calculator</a>.</li>
      <li><strong>Transfer:</strong> the fee is added to the amount moved. In the example, ${formatPercent(input.transferFeePercent, 0)} of ${formatCurrency(input.balance)}
      is ${formatCurrency(example.transferFee)}, so ${formatCurrency(example.transferredBalance)} is transferred. The intro APR applies for the intro months, then the
      post-intro APR applies to whatever is left.</li>
      <li>Both paths use the same monthly payment. The result is the difference in total paid to payoff, fee included.</li>
    </ol>
    <p>In the example the transfer ${example.netSavings > 0 ? html`saves <strong>${formatCurrency(example.netSavings)}</strong>` : html`costs <strong>${formatCurrency(-example.netSavings)}</strong> more`}
    and the balance is paid off in ${formatDuration(example.transfer.payoffMonths)} instead of ${formatDuration(example.keep.payoffMonths)}.</p>
  </section>

  <section class="content-section" aria-labelledby="bt-promo-heading">
    <h2 id="bt-promo-heading">What happens when the intro period ends</h2>
    <p>An introductory rate must last at least six months unless you are more than 60 days late, and the rate on any balance left afterwards can rise
    (<a href="${SOURCES.balanceTransferIntroLength.url}">CFPB: how long an intro rate lasts</a>). In the example, ${formatCurrency(example.transfer.balanceAtPromoEnd)}
    is still owed after month ${input.introMonths}. To clear the transferred balance within the intro period you would pay
    <strong>${formatCurrency(example.paymentToClearDuringPromo)}</strong> a month: the transferred balance spread evenly over the intro months at the intro APR.
    Paying ${formatCurrency(clearing.input.monthlyPayment)} a month clears it in ${formatDuration(clearing.transfer.payoffMonths)} with ${formatCurrency(clearing.transfer.interest)} of interest.</p>
  </section>

  <section class="content-section" aria-labelledby="bt-fee-heading">
    <h2 id="bt-fee-heading">When the fee costs more than it saves</h2>
    <p>A balance transfer fee can be charged even on a 0% offer (<a href="${SOURCES.balanceTransferFee.url}">CFPB: balance transfer fees</a>). If you could pay the
    balance off quickly anyway, the fee may be more than the interest you avoid. For example, moving ${formatCurrency(shortPromo.input.balance)} from an
    ${formatPercent(shortPromo.input.currentApr, 0)} card with a ${formatPercent(shortPromo.input.transferFeePercent, 0)} fee while paying
    ${formatCurrency(shortPromo.input.monthlyPayment)} a month ${shortPromo.netSavings > 0 ? `saves only ${formatCurrency(shortPromo.netSavings)}` : `costs ${formatCurrency(-shortPromo.netSavings)} more than keeping the card`}.</p>
  </section>

  <section class="content-section" aria-labelledby="bt-intro-apr-heading">
    <h2 id="bt-intro-apr-heading">Offers with a low but not zero intro APR</h2>
    <p>Some offers charge a low intro APR instead of 0%. The calculator charges it as entered. With a ${formatPercent(introRate.input.introApr)} intro APR, the example
    transfer's interest rises from ${formatCurrency(example.transfer.interest)} to ${formatCurrency(introRate.transfer.interest)}, and the payment needed to clear the balance
    during the intro period becomes ${formatCurrency(introRate.paymentToClearDuringPromo)}.</p>
  </section>

  <section class="content-section" aria-labelledby="bt-assumptions-heading">
    <h2 id="bt-assumptions-heading">Assumptions and limitations</h2>
    <ul>
      <li>You make the same fixed payment on both cards and never pay late. Issuers' minimum-payment formulas are not modelled.</li>
      <li>No new purchases. Carrying a promotional balance can mean new purchases on that card are charged interest
      (<a href="${SOURCES.zeroPercentPurchases.url}">CFPB: interest on 0% offers</a>).</li>
      <li>Interest is APR ÷ 12 on the balance each month. Card statements often use a daily rate on the average daily balance, so real interest can differ slightly.</li>
      <li>Annual fees, penalty APRs, deferred-interest promotions and credit score effects are not included.</li>
      <li>No offer, issuer or approval is assumed. Enter the terms from your own offer. Results are estimates, not financial advice.</li>
    </ul>
    <p>If you are comparing a transfer with a fixed-rate loan to pay the balance off, the
    <a href="/calculators/personal-loan-calculator/">personal loan calculator</a> shows a loan's true cost including an origination fee.</p>
  </section>

  <section class="content-section" aria-labelledby="bt-method-heading">
    <h2 id="bt-method-heading">Methodology and testing</h2>
    <p>The "keep" path uses the same tested payoff engine as our credit card payoff calculator. Automated tests check the transfer path against a hand-worked example,
    closed-form balances at the end of the intro period, the payment that clears the balance exactly on time, and an independent simulation of 300 random offers,
    including non-zero intro APRs, zero fees and zero-length promotions. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.balanceTransferIntroLength, SOURCES.balanceTransferFee, SOURCES.zeroPercentPurchases])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/balance-transfer.js']
  };
}

/**
 * Results panel for the Solar Financing Calculator. Pure function of the view
 * model from src/adapters/energy/solar-financing.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';

export function financingResults({ input, result }) {
  if (result.noLoanNeeded) {
    return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">No loan needed</h2>
  ${statGrid([
    { label: 'Amount financed', value: formatCurrency(0), primary: true, note: 'Your down payment and rebates at purchase cover the price' },
    { label: 'Net installed price', value: formatCurrency(result.netInstalledPrice), note: 'Price minus all rebates' }
  ])}
</section>`;
  }
  const later = input.laterRebatesCents > 0;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your solar loan</h2>
  ${statGrid([
    { label: 'Monthly payment', value: formatCurrency(result.payment), primary: true, note: `${formatCount(result.payments)} payments at ${formatCount(input.annualRate)}%` },
    { label: 'Amount financed', value: formatCurrency(result.loan), note: input.feesCents > 0 ? `Including ${formatCurrency(input.feesCents / 100)} of fees` : 'Price minus down payment and rebates at purchase' },
    { label: 'Total interest', value: formatCurrency(result.interest), note: 'The sum of each month\'s interest' },
    { label: 'Total of payments', value: formatCurrency(result.totalOfPayments) },
    { label: 'Down payment + loan payments', value: formatCurrency(result.financingOutlay), note: 'What you pay in total' },
    ...(later ? [{ label: 'After later rebates', value: formatCurrency(result.netCostAfterLaterRebates), note: `Less ${formatCurrency(input.laterRebatesCents / 100)} received later` }] : [])
  ])}
  <p class="note">Uses the loan's interest rate. The cost of borrowing is the interest plus any fees added to the loan.</p>
</section>`;
}

export function financingQuickResult({ result }) {
  if (result.noLoanNeeded) return html`<strong>No loan needed.</strong> <a href="#summary-heading">See full results</a>`;
  return html`<strong>${formatCurrency(result.payment)}</strong> a month, ${formatCurrency(result.interest)} of interest. <a href="#summary-heading">See full results</a>`;
}

export function financingAnnouncement({ result }) {
  return result.noLoanNeeded ? 'No loan needed.' : `Monthly payment ${formatCurrency(result.payment)}, total interest ${formatCurrency(result.interest)}.`;
}

/**
 * Results panel for the HELOC Payment Calculator. Pure function of the view
 * model from src/adapters/heloc.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration, formatPercent } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const shockText = (view) => (view.paymentShockPercent === null
  ? formatCurrency(view.paymentShock)
  : `${formatCurrency(view.paymentShock)} (${formatPercent(view.paymentShockPercent, 0)})`);

function summary(view) {
  return statGrid([
    { label: 'Payment during the draw period', value: formatCurrency(view.drawPayment), note: view.input.drawPaymentType === 'interestOnly' ? 'Interest only' : 'Principal and interest' },
    { label: 'Payment when repayment starts', value: formatCurrency(view.repaymentPayment), primary: true, note: `From month ${view.repaymentStartMonth}, for ${formatDuration(view.input.repaymentMonths)}` },
    { label: 'Payment increase (payment shock)', value: view.paymentShock > 0.005 ? shockText(view) : formatCurrency(0), note: 'Repayment payment minus draw payment' },
    { label: 'Balance when repayment starts', value: formatCurrency(view.repaymentStartingBalance) },
    { label: 'Total interest', value: formatCurrency(view.totalInterest), note: `${formatCurrency(view.drawInterest)} in the draw period, ${formatCurrency(view.repaymentInterest)} in repayment` },
    { label: 'Total payments', value: formatCurrency(view.totalPayments) }
  ]);
}

function shockNote(view) {
  if (view.paymentShock <= 0.005) {
    return html`<p class="callout">With principal-and-interest payments from the start, the payment stays the same when repayment begins.</p>`;
  }
  return html`<p class="callout callout--warning"><strong>Your payment rises by ${shockText(view)} in month ${view.repaymentStartMonth}.</strong>
  During the draw period you pay ${view.input.drawPaymentType === 'interestOnly' ? 'only interest, so the balance does not fall' : 'part of the balance'};
  repayment then spreads ${formatCurrency(view.repaymentStartingBalance)} over ${formatDuration(view.input.repaymentMonths)}.</p>`;
}

function scenarioTable(view) {
  return dataTable({
    id: 'rate-scenarios',
    title: 'If the rate changes (same balance and periods)',
    columns: [
      { key: 'rate', label: 'Rate' },
      { key: 'draw', label: 'Draw-period payment', numeric: true },
      { key: 'repayment', label: 'Repayment payment', numeric: true },
      { key: 'shock', label: 'Increase', numeric: true }
    ],
    rows: view.scenarios.map((row) => ({
      rate: `${formatPercent(row.annualRate)}${row.points ? ` (+${row.points} pt)` : ' (your rate)'}`,
      draw: formatCurrency(row.drawPayment),
      repayment: formatCurrency(row.repaymentPayment),
      shock: formatCurrency(row.paymentShock),
      selected: row.points === 0
    }))
  });
}

function yearlyTable(view) {
  const phase = { draw: 'Draw', repayment: 'Repayment', both: 'Draw → repayment' };
  return dataTable({
    id: 'heloc-yearly',
    title: 'Year by year',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'phase', label: 'Phase' },
      { key: 'payment', label: 'Payments', numeric: true },
      { key: 'interest', label: 'Interest', numeric: true },
      { key: 'principal', label: 'Principal', numeric: true },
      { key: 'balance', label: 'Balance at year end', numeric: true }
    ],
    rows: view.yearly.map((row) => ({
      year: String(row.year),
      phase: phase[row.phase],
      payment: formatCurrency(row.payment),
      interest: formatCurrency(row.interest),
      principal: formatCurrency(row.principal),
      balance: formatCurrency(row.balance),
      selected: row.phase === 'both'
    }))
  });
}

export function helocResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your HELOC payment estimate</h2>
  ${summary(view)}
  ${shockNote(view)}
  <p class="note">The rate is held constant for this estimate. Real HELOC rates are usually variable, so see the rate table below.</p>
</section>
<section class="result-block" aria-labelledby="scenarios-heading">
  <h2 id="scenarios-heading">If your rate rises</h2>
  ${scenarioTable(view)}
</section>
<section class="result-block" aria-labelledby="yearly-heading">
  <h2 id="yearly-heading">Payments over the life of the line</h2>
  ${yearlyTable(view)}
</section>`;
}

export function helocQuickResult(view) {
  return html`<strong>${formatCurrency(view.drawPayment)}</strong>/month now, <strong>${formatCurrency(view.repaymentPayment)}</strong>/month in repayment.
  <a href="#summary-heading">See full results</a>`;
}

export function helocAnnouncement(view) {
  return `Draw-period payment ${formatCurrency(view.drawPayment)}. Repayment payment ${formatCurrency(view.repaymentPayment)}. Increase ${formatCurrency(Math.max(0, view.paymentShock))}.`;
}

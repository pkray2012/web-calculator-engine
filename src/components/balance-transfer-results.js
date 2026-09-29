/**
 * Results panel for the Balance Transfer Calculator. Pure function of the
 * view model from src/adapters/balance-transfer.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration, formatCount, formatPercent } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const saves = (view) => view.netSavings > 0.005;

function verdictValue(view) {
  if (Math.abs(view.netSavings) < 0.005) return 'Break-even';
  return saves(view) ? `Saves ${formatCurrency(view.netSavings)}` : `Costs ${formatCurrency(-view.netSavings)} more`;
}

function summary(view) {
  const stats = [
    { label: 'Balance transfer result', value: verdictValue(view), primary: true, note: 'Total cost to payoff, fee included' },
    { label: 'Transfer fee', value: formatCurrency(view.transferFee), note: `Added to the balance: ${formatCurrency(view.transferredBalance)}` },
    {
      label: 'Balance left when the intro period ends',
      value: view.transfer.clearsDuringPromo ? formatCurrency(0) : formatCurrency(view.transfer.balanceAtPromoEnd),
      note: view.transfer.clearsDuringPromo ? `Paid off in month ${view.transfer.payoffMonths}` : `After month ${view.introMonths}`
    }
  ];
  if (view.paymentToClearDuringPromo !== null) {
    stats.push({ label: 'Monthly payment to clear it during the intro period', value: formatCurrency(view.paymentToClearDuringPromo), note: `${formatCount(view.introMonths)} equal payments` });
  }
  stats.push({ label: 'Time to pay off', value: formatDuration(view.transfer.payoffMonths), note: `vs. ${formatDuration(view.keep.payoffMonths)} if you keep the card` });
  return statGrid(stats);
}

function verdictNote(view) {
  if (!saves(view)) {
    return html`<p class="callout callout--warning"><strong>At this payment the transfer does not save money.</strong>
    The ${formatCurrency(view.transferFee)} fee${view.transfer.balanceAtPromoEnd > 0.005 ? ' and interest after the intro period' : ''} cost more than the interest you would avoid.</p>`;
  }
  if (!view.transfer.clearsDuringPromo && view.introMonths > 0) {
    return html`<p class="callout callout--warning"><strong>${formatCurrency(view.transfer.balanceAtPromoEnd)} is still owed when the intro period ends</strong>,
    and is then charged ${formatPercent(view.input.postIntroApr)} APR. Paying ${formatCurrency(view.paymentToClearDuringPromo)} a month would clear it in time.</p>`;
  }
  return html`<p class="callout">The transfer saves <strong>${formatCurrency(view.netSavings)}</strong> after the fee and pays the balance off
  ${view.monthsSaved > 0 ? html`<strong>${formatDuration(view.monthsSaved)} sooner</strong>` : 'on the same schedule'}.</p>`;
}

function comparison(view) {
  return dataTable({
    id: 'transfer-compare',
    title: 'Keep the card vs. transfer, at the same monthly payment',
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'keep', label: 'Keep the card', numeric: true },
      { key: 'transfer', label: 'Transfer', numeric: true }
    ],
    rows: [
      { item: 'Transfer fee', keep: formatCurrency(0), transfer: formatCurrency(view.transferFee) },
      { item: 'Interest', keep: formatCurrency(view.keep.interest), transfer: formatCurrency(view.transfer.interest) },
      { item: 'Time to pay off', keep: formatDuration(view.keep.payoffMonths), transfer: formatDuration(view.transfer.payoffMonths) },
      { item: 'Total paid', keep: formatCurrency(view.keep.totalCost), transfer: formatCurrency(view.transfer.totalCost), selected: true }
    ]
  });
}

function schedule(view) {
  const table = dataTable({
    id: 'transfer-schedule',
    title: 'Transferred balance, month by month',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'apr', label: 'APR', numeric: true },
      { key: 'payment', label: 'Payment', numeric: true },
      { key: 'interest', label: 'Interest', numeric: true },
      { key: 'balance', label: 'Balance', numeric: true }
    ],
    rows: view.transfer.schedule.map((row) => ({
      month: String(row.month),
      apr: formatPercent(row.apr),
      payment: formatCurrency(row.payment),
      interest: formatCurrency(row.interest),
      balance: formatCurrency(row.balance),
      selected: row.month === view.introMonths
    }))
  });
  return html`<details class="disclosure">
  <summary>Show all ${formatCount(view.transfer.schedule.length)} monthly payments on the transferred balance</summary>
  ${table}
</details>`;
}

export function balanceTransferResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your balance transfer estimate</h2>
  ${summary(view)}
  ${verdictNote(view)}
  <p class="note">Assumes the same monthly payment on both cards, no new purchases, and monthly interest at APR ÷ 12.</p>
</section>
<section class="result-block" aria-labelledby="compare-heading">
  <h2 id="compare-heading">Keep vs. transfer, to payoff</h2>
  ${comparison(view)}
  ${schedule(view)}
</section>`;
}

export function balanceTransferQuickResult(view) {
  return html`<strong>${verdictValue(view)}</strong> · paid off in ${formatDuration(view.transfer.payoffMonths)}.
  <a href="#summary-heading">See full results</a>`;
}

export function balanceTransferAnnouncement(view) {
  return `Balance transfer: ${verdictValue(view)}. Fee ${formatCurrency(view.transferFee)}. Balance left when the intro period ends ${formatCurrency(view.transfer.clearsDuringPromo ? 0 : view.transfer.balanceAtPromoEnd)}.`;
}

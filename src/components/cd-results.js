/**
 * Results panel for the CD Calculator. Pure function of the view model from
 * src/adapters/certificate-of-deposit.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration, formatMonth } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const pct = (fraction) => formatPercent(fraction * 100, 3);
const LABELS = { daily: 'Daily', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' };

function earlyBlock(view) {
  const early = view.earlyWithdrawal;
  if (!early) return '';
  const verdict = early.losesPrincipal
    ? html`<p class="callout">Cashing in after ${formatDuration(early.month)} returns <strong>${formatCurrency(early.received)}</strong>, <strong>${formatCurrency(-early.gain)} less than you deposited</strong>: the penalty is larger than the interest earned so far.</p>`
    : html`<p class="callout">Cashing in after ${formatDuration(early.month)} returns <strong>${formatCurrency(early.received)}</strong>, a gain of ${formatCurrency(early.gain)} after the penalty, compared with ${formatCurrency(view.interest)} of interest if you wait until the CD matures.</p>`;
  return html`<section class="result-block" aria-labelledby="cd-early-heading">
  <h2 id="cd-early-heading">If you cash in early</h2>
  ${verdict}
  ${dataTable({
    id: 'cd-early',
    title: `Cashing in after ${formatDuration(early.month)}`,
    columns: [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows: [
      { item: 'Balance with interest', amount: formatCurrency(early.balance) },
      { item: `Penalty (${view.input.penaltyMonths} months' interest)`, amount: `−${formatCurrency(early.penalty)}` },
      { item: 'You receive', amount: formatCurrency(early.received), selected: true }
    ]
  })}
</section>`;
}

export function cdResults(view) {
  const { input } = view;
  const taxed = input.taxPercent > 0;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your CD at maturity</h2>
  ${statGrid([
    { label: 'Value at maturity', value: formatCurrency(view.maturityValue), primary: true, note: view.maturityMonth ? `Matures in ${formatMonth(view.maturityMonth)}` : `After ${formatDuration(input.termMonths)}` },
    { label: 'Interest earned', value: formatCurrency(view.interest), note: taxed ? `${formatCurrency(view.afterTaxInterest)} after ${formatPercent(input.taxPercent, 0)} tax` : 'Before tax' },
    { label: 'APY', value: pct(view.apy), note: `Interest rate ${pct(view.statedRate)} compounded ${LABELS[input.compounding].toLowerCase()}` }
  ])}
  ${dataTable({
    id: 'cd-growth',
    title: 'Balance over the term',
    columns: [{ key: 'when', label: 'After' }, { key: 'interest', label: 'Interest earned', numeric: true }, { key: 'balance', label: 'Balance', numeric: true }],
    rows: view.schedule.map((row) => ({ when: formatDuration(row.month), interest: formatCurrency(row.interest), balance: formatCurrency(row.balance), selected: row.month === input.termMonths }))
  })}
  ${dataTable({
    id: 'cd-compounding',
    title: `The same ${pct(view.statedRate)} interest rate compounded differently`,
    columns: [{ key: 'how', label: 'Compounding' }, { key: 'apy', label: 'APY', numeric: true }, { key: 'interest', label: 'Interest at maturity', numeric: true }],
    rows: view.byCompounding.map((row) => ({ how: LABELS[row.compounding], apy: pct(row.apy), interest: formatCurrency(row.interest), selected: row.compounding === input.compounding }))
  })}
</section>
${earlyBlock(view)}`;
}

export function cdQuickResult(view) {
  return html`<strong>${formatCurrency(view.maturityValue)}</strong> at maturity: ${formatCurrency(view.interest)} of interest. <a href="#summary-heading">See full results</a>`;
}

export function cdAnnouncement(view) {
  return `Your CD grows to ${formatCurrency(view.maturityValue)} after ${formatDuration(view.input.termMonths)}, earning ${formatCurrency(view.interest)} of interest.`;
}

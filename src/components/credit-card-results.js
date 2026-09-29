/**
 * Results panel for the Credit Card Payoff Calculator, composed from the
 * shared amortized-loan sections.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration } from '../lib/format.js';
import {
  summaryBlock, extraPaymentBlock, termComparisonBlock, scheduleBlock, quickResult
} from './amortized-results.js';

export function creditCardResults(view) {
  const { card } = view;
  return html`${summaryBlock(view, {
    principalLabel: 'Balance',
    rateLabel: 'APR',
    extraStats: [
      { label: 'Interest this month', value: formatCurrency(card.firstMonthInterest), note: 'Charged on the current balance' }
    ],
    note: 'Assumes no new purchases, fees or rate changes while you pay the card off.'
  })}
${card.mode === 'payment' ? extraPaymentBlock(view) : ''}
${termComparisonBlock(view, {
    heading: 'Compare payoff dates',
    title: 'Monthly payment needed to be debt-free by…',
    note: 'Paying the card off faster takes a bigger payment but costs less interest.'
  })}
${scheduleBlock(view, { heading: 'Payoff schedule' })}`;
}

export function creditCardQuickResult(view) {
  return view.card.mode === 'target'
    ? quickResult(view)
    : html`Paid off in <strong>${formatDuration(view.payments)}</strong> ·
  ${formatCurrency(view.totalInterest)} interest. <a href="#summary-heading">See full results</a>`;
}

export function creditCardAnnouncement(view) {
  const extra = view.extra ? ` Paying extra could save ${formatCurrency(view.extra.interestSaved)}.` : '';
  return `Monthly payment ${formatCurrency(view.monthlyPayment)}. Paid off in ${formatDuration(view.payments)} with ${formatCurrency(view.totalInterest)} of interest.${extra}`;
}

/**
 * Results panel for the Loan Payment Calculator, composed from the shared
 * amortized-loan sections.
 */

import { html } from '../lib/html.js';
import {
  summaryBlock, extraPaymentBlock, termComparisonBlock, scheduleBlock, quickResult, announcement
} from './amortized-results.js';

export function loanResults(view) {
  return html`${summaryBlock(view)}
${extraPaymentBlock(view)}
${termComparisonBlock(view)}
${scheduleBlock(view)}`;
}

export const loanQuickResult = quickResult;
export const loanAnnouncement = announcement;

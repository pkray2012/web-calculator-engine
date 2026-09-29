/**
 * Browser entry for the Loan Payment Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runLoanCalculator, LOAN_DEFAULTS } from '../adapters/loan-payment.js';
import { loanResults, loanAnnouncement, loanQuickResult } from '../components/loan-results.js';
import { LOAN_FIELD_IDS } from '../components/loan-form.js';

mountCalculator({
  defaults: LOAN_DEFAULTS,
  fieldIds: LOAN_FIELD_IDS,
  run: runLoanCalculator,
  render: loanResults,
  quick: loanQuickResult,
  announce: loanAnnouncement
});

/**
 * Browser entry for the Loan Payoff Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runPayoffCalculator, PAYOFF_DEFAULTS } from '../adapters/loan-payoff.js';
import { loanPayoffResults, loanPayoffQuickResult, loanPayoffAnnouncement } from '../components/loan-payoff-results.js';
import { PAYOFF_FIELD_IDS } from '../components/loan-payoff-form.js';

mountCalculator({
  defaults: PAYOFF_DEFAULTS,
  fieldIds: PAYOFF_FIELD_IDS,
  run: runPayoffCalculator,
  render: loanPayoffResults,
  quick: loanPayoffQuickResult,
  announce: loanPayoffAnnouncement
});

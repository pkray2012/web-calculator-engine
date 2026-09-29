/**
 * Browser entry for the Home Equity Loan Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runHelCalculator, HEL_DEFAULTS } from '../adapters/home-equity-loan.js';
import { homeEquityLoanResults, homeEquityQuickResult, homeEquityAnnouncement } from '../components/home-equity-loan-results.js';
import { HEL_FIELD_IDS } from '../components/home-equity-loan-form.js';

mountCalculator({
  defaults: HEL_DEFAULTS,
  fieldIds: HEL_FIELD_IDS,
  run: runHelCalculator,
  render: homeEquityLoanResults,
  quick: homeEquityQuickResult,
  announce: homeEquityAnnouncement
});

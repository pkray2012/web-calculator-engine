/**
 * Browser entry for the Auto Loan Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runAutoCalculator, AUTO_DEFAULTS } from '../adapters/auto-loan.js';
import { autoLoanResults, autoQuickResult, autoAnnouncement } from '../components/auto-loan-results.js';
import { AUTO_FIELD_IDS } from '../components/auto-loan-form.js';

mountCalculator({
  defaults: AUTO_DEFAULTS,
  fieldIds: AUTO_FIELD_IDS,
  run: runAutoCalculator,
  render: autoLoanResults,
  quick: autoQuickResult,
  announce: autoAnnouncement
});

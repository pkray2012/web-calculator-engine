/**
 * Browser entry for the Personal Loan Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runPersonalCalculator, PERSONAL_DEFAULTS } from '../adapters/personal-loan.js';
import { personalLoanResults, personalQuickResult, personalAnnouncement } from '../components/personal-loan-results.js';
import { PERSONAL_FIELD_IDS } from '../components/personal-loan-form.js';

mountCalculator({
  defaults: PERSONAL_DEFAULTS,
  fieldIds: PERSONAL_FIELD_IDS,
  run: runPersonalCalculator,
  render: personalLoanResults,
  quick: personalQuickResult,
  announce: personalAnnouncement
});

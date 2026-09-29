/**
 * Browser entry for the Student Loan Refinance Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runSlrCalculator, SLR_DEFAULTS } from '../adapters/student-loan-refinance.js';
import { studentLoanRefinanceResults, studentLoanRefinanceQuickResult, studentLoanRefinanceAnnouncement } from '../components/student-loan-refinance-results.js';
import { SLR_FIELD_IDS } from '../components/student-loan-refinance-form.js';

mountCalculator({
  defaults: SLR_DEFAULTS,
  fieldIds: SLR_FIELD_IDS,
  run: runSlrCalculator,
  render: studentLoanRefinanceResults,
  quick: studentLoanRefinanceQuickResult,
  announce: studentLoanRefinanceAnnouncement
});

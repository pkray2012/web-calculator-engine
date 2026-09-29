/**
 * Browser entry for the Auto Loan Refinance Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runAutoRefiCalculator, AUTO_REFI_DEFAULTS } from '../adapters/auto-loan-refinance.js';
import { autoRefinanceResults, autoRefinanceQuickResult, autoRefinanceAnnouncement } from '../components/auto-refinance-results.js';
import { AUTO_REFI_FIELD_IDS } from '../components/auto-refinance-form.js';

mountCalculator({
  defaults: AUTO_REFI_DEFAULTS,
  fieldIds: AUTO_REFI_FIELD_IDS,
  run: runAutoRefiCalculator,
  render: autoRefinanceResults,
  quick: autoRefinanceQuickResult,
  announce: autoRefinanceAnnouncement
});

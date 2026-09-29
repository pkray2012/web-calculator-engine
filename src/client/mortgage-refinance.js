/**
 * Browser entry for the Mortgage Refinance Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runRefiCalculator, REFI_DEFAULTS } from '../adapters/mortgage-refinance.js';
import { refinanceResults, refinanceQuickResult, refinanceAnnouncement } from '../components/refinance-results.js';
import { REFI_FIELD_IDS } from '../components/refinance-form.js';

mountCalculator({
  defaults: REFI_DEFAULTS,
  fieldIds: REFI_FIELD_IDS,
  run: runRefiCalculator,
  render: refinanceResults,
  quick: refinanceQuickResult,
  announce: refinanceAnnouncement
});

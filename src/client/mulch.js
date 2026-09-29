/**
 * Browser entry for the Mulch Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runMulchCalculator, MULCH_DEFAULTS } from '../adapters/mulch.js';
import { mulchResults, mulchQuickResult, mulchAnnouncement } from '../components/mulch-results.js';
import { MULCH_FIELD_IDS } from '../components/mulch-form.js';

mountCalculator({
  defaults: MULCH_DEFAULTS,
  fieldIds: MULCH_FIELD_IDS,
  run: runMulchCalculator,
  render: mulchResults,
  quick: mulchQuickResult,
  announce: mulchAnnouncement
});

/**
 * Browser entry for the Percentage Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runPercentCalculator, PERCENT_DEFAULTS } from '../adapters/percentage.js';
import { percentResults, percentQuickResult, percentAnnouncement } from '../components/percentage-results.js';
import { PERCENT_FIELD_IDS } from '../components/percentage-form.js';

mountCalculator({
  defaults: PERCENT_DEFAULTS,
  fieldIds: PERCENT_FIELD_IDS,
  run: runPercentCalculator,
  render: percentResults,
  quick: percentQuickResult,
  announce: percentAnnouncement
});

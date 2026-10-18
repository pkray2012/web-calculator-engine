/**
 * Browser entry for the Stair Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runStairCalculator, STAIR_DEFAULTS } from '../adapters/stair.js';
import { stairResults, stairQuickResult, stairAnnouncement } from '../components/stair-results.js';
import { STAIR_FIELD_IDS } from '../components/stair-form.js';

mountCalculator({
  defaults: STAIR_DEFAULTS,
  fieldIds: STAIR_FIELD_IDS,
  run: runStairCalculator,
  render: stairResults,
  quick: stairQuickResult,
  announce: stairAnnouncement
});

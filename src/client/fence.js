/**
 * Browser entry for the Fence Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runFenceCalculator, FENCE_DEFAULTS } from '../adapters/fence.js';
import { fenceResults, fenceQuickResult, fenceAnnouncement } from '../components/fence-results.js';
import { FENCE_FIELD_IDS } from '../components/fence-form.js';

mountCalculator({
  defaults: FENCE_DEFAULTS,
  fieldIds: FENCE_FIELD_IDS,
  run: runFenceCalculator,
  render: fenceResults,
  quick: fenceQuickResult,
  announce: fenceAnnouncement
});

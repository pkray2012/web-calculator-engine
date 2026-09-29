/**
 * Browser entry for the Roofing Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runRoofingCalculator, ROOFING_DEFAULTS } from '../adapters/roofing.js';
import { roofingResults, roofingQuickResult, roofingAnnouncement } from '../components/roofing-results.js';
import { ROOFING_FIELD_IDS } from '../components/roofing-form.js';

mountCalculator({
  defaults: ROOFING_DEFAULTS,
  fieldIds: ROOFING_FIELD_IDS,
  run: runRoofingCalculator,
  render: roofingResults,
  quick: roofingQuickResult,
  announce: roofingAnnouncement
});

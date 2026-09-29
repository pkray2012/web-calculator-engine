/**
 * Browser entry for the Drywall Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runDrywallCalculator, DRYWALL_DEFAULTS } from '../adapters/drywall.js';
import { drywallResults, drywallQuickResult, drywallAnnouncement } from '../components/drywall-results.js';
import { DRYWALL_FIELD_IDS } from '../components/drywall-form.js';

mountCalculator({
  defaults: DRYWALL_DEFAULTS,
  fieldIds: DRYWALL_FIELD_IDS,
  run: runDrywallCalculator,
  render: drywallResults,
  quick: drywallQuickResult,
  announce: drywallAnnouncement
});

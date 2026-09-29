/**
 * Browser entry for the BTU Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runBtuCalculator, BTU_DEFAULTS } from '../adapters/btu.js';
import { btuResults, btuQuickResult, btuAnnouncement } from '../components/btu-results.js';
import { BTU_FIELD_IDS } from '../components/btu-form.js';

mountCalculator({
  defaults: BTU_DEFAULTS,
  fieldIds: BTU_FIELD_IDS,
  run: runBtuCalculator,
  render: btuResults,
  quick: btuQuickResult,
  announce: btuAnnouncement
});

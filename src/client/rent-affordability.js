/**
 * Browser entry for the Rent Affordability Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runRentAffordabilityCalculator, RENT_AFFORD_DEFAULTS } from '../adapters/rent-affordability.js';
import { rentAffordabilityResults, rentAffordabilityQuickResult, rentAffordabilityAnnouncement } from '../components/rent-affordability-results.js';
import { RENT_AFFORD_FIELD_IDS } from '../components/rent-affordability-form.js';

mountCalculator({
  defaults: RENT_AFFORD_DEFAULTS,
  fieldIds: RENT_AFFORD_FIELD_IDS,
  run: runRentAffordabilityCalculator,
  render: rentAffordabilityResults,
  quick: rentAffordabilityQuickResult,
  announce: rentAffordabilityAnnouncement
});

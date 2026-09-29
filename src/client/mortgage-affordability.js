/**
 * Browser entry for the Home Affordability Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runAffordabilityCalculator, AFFORDABILITY_DEFAULTS } from '../adapters/mortgage-affordability.js';
import { affordabilityResults, affordabilityQuickResult, affordabilityAnnouncement } from '../components/affordability-results.js';
import { AFFORDABILITY_FIELD_IDS } from '../components/affordability-form.js';

mountCalculator({
  defaults: AFFORDABILITY_DEFAULTS,
  fieldIds: AFFORDABILITY_FIELD_IDS,
  run: runAffordabilityCalculator,
  render: affordabilityResults,
  quick: affordabilityQuickResult,
  announce: affordabilityAnnouncement
});

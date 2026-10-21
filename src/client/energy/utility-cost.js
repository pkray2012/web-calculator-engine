/**
 * Browser entry for the Utility Cost Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runUtilityCalculator, UTILITY_DEFAULTS } from '../../adapters/energy/utility-cost.js';
import { utilityResults, utilityQuickResult, utilityAnnouncement } from '../../components/energy/utility-cost-results.js';
import { UTILITY_FIELD_IDS } from '../../components/energy/utility-cost-form.js';

mountCalculator({
  defaults: UTILITY_DEFAULTS,
  fieldIds: UTILITY_FIELD_IDS,
  run: runUtilityCalculator,
  render: utilityResults,
  quick: utilityQuickResult,
  announce: utilityAnnouncement
});

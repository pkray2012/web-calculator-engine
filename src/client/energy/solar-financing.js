/**
 * Browser entry for the Solar Financing Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runFinancingCalculator, FINANCING_DEFAULTS } from '../../adapters/energy/solar-financing.js';
import { financingResults, financingQuickResult, financingAnnouncement } from '../../components/energy/solar-financing-results.js';
import { FINANCING_FIELD_IDS } from '../../components/energy/solar-financing-form.js';

mountCalculator({
  defaults: FINANCING_DEFAULTS,
  fieldIds: FINANCING_FIELD_IDS,
  run: runFinancingCalculator,
  render: financingResults,
  quick: financingQuickResult,
  announce: financingAnnouncement
});

/**
 * Browser entry for the Electricity Rate Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runRateCalculator, RATE_DEFAULTS } from '../../adapters/energy/electricity-rate.js';
import { rateResults, rateQuickResult, rateAnnouncement } from '../../components/energy/electricity-rate-results.js';
import { RATE_FIELD_IDS } from '../../components/energy/electricity-rate-form.js';

mountCalculator({
  defaults: RATE_DEFAULTS,
  fieldIds: RATE_FIELD_IDS,
  run: runRateCalculator,
  render: rateResults,
  quick: rateQuickResult,
  announce: rateAnnouncement
});

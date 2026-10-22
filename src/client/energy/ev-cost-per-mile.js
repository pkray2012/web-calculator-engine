/**
 * Browser entry for the EV Cost Per Mile Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runPerMileCalculator, PER_MILE_DEFAULTS } from '../../adapters/energy/ev-cost-per-mile.js';
import { perMileResults, perMileQuickResult, perMileAnnouncement } from '../../components/energy/ev-cost-per-mile-results.js';
import { PER_MILE_FIELD_IDS } from '../../components/energy/ev-cost-per-mile-form.js';

mountCalculator({
  defaults: PER_MILE_DEFAULTS,
  fieldIds: PER_MILE_FIELD_IDS,
  run: runPerMileCalculator,
  render: perMileResults,
  quick: perMileQuickResult,
  announce: perMileAnnouncement
});

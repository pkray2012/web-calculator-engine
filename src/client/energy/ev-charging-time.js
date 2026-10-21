/**
 * Browser entry for the EV Charging Time Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runEvTimeCalculator, EV_TIME_DEFAULTS } from '../../adapters/energy/charging-time.js';
import { chargeResults, chargeQuickResult, chargeAnnouncement } from '../../components/energy/charging-time-results.js';
import { EV_TIME_FIELD_IDS } from '../../components/energy/charging-time-form.js';

mountCalculator({
  defaults: EV_TIME_DEFAULTS,
  fieldIds: EV_TIME_FIELD_IDS,
  run: runEvTimeCalculator,
  render: chargeResults,
  quick: chargeQuickResult,
  announce: chargeAnnouncement
});

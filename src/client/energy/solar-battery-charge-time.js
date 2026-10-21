/**
 * Browser entry for the Solar Battery Charging Time Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runBatteryCalculator, BATTERY_DEFAULTS } from '../../adapters/energy/charging-time.js';
import { chargeResults, chargeQuickResult, chargeAnnouncement } from '../../components/energy/charging-time-results.js';
import { BATTERY_FIELD_IDS } from '../../components/energy/charging-time-form.js';

mountCalculator({
  defaults: BATTERY_DEFAULTS,
  fieldIds: BATTERY_FIELD_IDS,
  run: runBatteryCalculator,
  render: chargeResults,
  quick: chargeQuickResult,
  announce: chargeAnnouncement
});

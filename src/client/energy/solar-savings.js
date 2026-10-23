/**
 * Browser entry for the Solar Savings Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runSolarSavingsCalculator, SOLAR_SAVINGS_DEFAULTS } from '../../adapters/energy/solar-savings.js';
import { solarSavingsResults, solarSavingsQuickResult, solarSavingsAnnouncement } from '../../components/energy/solar-savings-results.js';
import { SOLAR_SAVINGS_FIELD_IDS } from '../../components/energy/solar-savings-form.js';

mountCalculator({
  defaults: SOLAR_SAVINGS_DEFAULTS,
  fieldIds: SOLAR_SAVINGS_FIELD_IDS,
  run: runSolarSavingsCalculator,
  render: solarSavingsResults,
  quick: solarSavingsQuickResult,
  announce: solarSavingsAnnouncement
});

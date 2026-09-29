/**
 * Browser entry for the Fuel Cost Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runFuelCalculator, FUEL_DEFAULTS } from '../adapters/fuel-cost.js';
import { fuelResults, fuelQuickResult, fuelAnnouncement } from '../components/fuel-cost-results.js';
import { FUEL_FIELD_IDS } from '../components/fuel-cost-form.js';

mountCalculator({
  defaults: FUEL_DEFAULTS,
  fieldIds: FUEL_FIELD_IDS,
  run: runFuelCalculator,
  render: fuelResults,
  quick: fuelQuickResult,
  announce: fuelAnnouncement
});

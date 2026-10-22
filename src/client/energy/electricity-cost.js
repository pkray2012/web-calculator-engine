/**
 * Browser entry for the Electricity Cost Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runElectricityCostCalculator, ELECTRICITY_COST_DEFAULTS } from '../../adapters/energy/electricity-cost.js';
import { electricityCostResults, electricityCostQuickResult, electricityCostAnnouncement } from '../../components/energy/electricity-cost-results.js';
import { ELECTRICITY_COST_FIELD_IDS } from '../../components/energy/electricity-cost-form.js';

mountCalculator({
  defaults: ELECTRICITY_COST_DEFAULTS,
  fieldIds: ELECTRICITY_COST_FIELD_IDS,
  run: runElectricityCostCalculator,
  render: electricityCostResults,
  quick: electricityCostQuickResult,
  announce: electricityCostAnnouncement
});

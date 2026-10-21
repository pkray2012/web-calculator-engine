/**
 * Browser entry for the EV Charging Cost Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runEvCostCalculator, EV_COST_DEFAULTS } from '../../adapters/energy/ev-charging-cost.js';
import { evCostResults, evCostQuickResult, evCostAnnouncement } from '../../components/energy/ev-charging-cost-results.js';
import { EV_COST_FIELD_IDS } from '../../components/energy/ev-charging-cost-form.js';

mountCalculator({
  defaults: EV_COST_DEFAULTS,
  fieldIds: EV_COST_FIELD_IDS,
  run: runEvCostCalculator,
  render: evCostResults,
  quick: evCostQuickResult,
  announce: evCostAnnouncement
});

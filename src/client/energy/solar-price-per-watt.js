/**
 * Browser entry for the Solar Price Per Watt Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runPpwCalculator, PPW_DEFAULTS } from '../../adapters/energy/solar-price-per-watt.js';
import { ppwResults, ppwQuickResult, ppwAnnouncement } from '../../components/energy/solar-price-per-watt-results.js';
import { PPW_FIELD_IDS } from '../../components/energy/solar-price-per-watt-form.js';

mountCalculator({
  defaults: PPW_DEFAULTS,
  fieldIds: PPW_FIELD_IDS,
  run: runPpwCalculator,
  render: ppwResults,
  quick: ppwQuickResult,
  announce: ppwAnnouncement
});

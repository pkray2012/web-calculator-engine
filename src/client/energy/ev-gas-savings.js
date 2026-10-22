/**
 * Browser entry for the EV Gas Savings Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runSavingsCalculator, SAVINGS_DEFAULTS } from '../../adapters/energy/ev-gas-savings.js';
import { savingsResults, savingsQuickResult, savingsAnnouncement } from '../../components/energy/ev-gas-savings-results.js';
import { SAVINGS_FIELD_IDS } from '../../components/energy/ev-gas-savings-form.js';

mountCalculator({
  defaults: SAVINGS_DEFAULTS,
  fieldIds: SAVINGS_FIELD_IDS,
  run: runSavingsCalculator,
  render: savingsResults,
  quick: savingsQuickResult,
  announce: savingsAnnouncement
});

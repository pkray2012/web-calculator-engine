/**
 * Browser entry for the Savings Goal Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runSavingsCalculator, SAVINGS_DEFAULTS } from '../adapters/savings-goal.js';
import { savingsGoalResults, savingsQuickResult, savingsAnnouncement } from '../components/savings-goal-results.js';
import { SAVINGS_FIELD_IDS } from '../components/savings-goal-form.js';

mountCalculator({
  defaults: SAVINGS_DEFAULTS,
  fieldIds: SAVINGS_FIELD_IDS,
  run: runSavingsCalculator,
  render: savingsGoalResults,
  quick: savingsQuickResult,
  announce: savingsAnnouncement
});

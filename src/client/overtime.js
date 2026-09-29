/**
 * Browser entry for the Overtime Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runOvertimeCalculator, OVERTIME_DEFAULTS } from '../adapters/overtime.js';
import { overtimeResults, overtimeQuickResult, overtimeAnnouncement } from '../components/overtime-results.js';
import { OVERTIME_FIELD_IDS } from '../components/overtime-form.js';

mountCalculator({
  defaults: OVERTIME_DEFAULTS,
  fieldIds: OVERTIME_FIELD_IDS,
  run: runOvertimeCalculator,
  render: overtimeResults,
  quick: overtimeQuickResult,
  announce: overtimeAnnouncement
});

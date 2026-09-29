/**
 * Browser entry for the Time Card Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runTimeCardCalculator, TIME_CARD_DEFAULTS } from '../adapters/time-card.js';
import { timeCardResults, timeCardQuickResult, timeCardAnnouncement } from '../components/time-card-results.js';
import { TIME_CARD_FIELD_IDS } from '../components/time-card-form.js';

mountCalculator({
  defaults: TIME_CARD_DEFAULTS,
  fieldIds: TIME_CARD_FIELD_IDS,
  run: runTimeCardCalculator,
  render: timeCardResults,
  quick: timeCardQuickResult,
  announce: timeCardAnnouncement
});

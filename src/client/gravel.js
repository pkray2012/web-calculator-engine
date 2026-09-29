/**
 * Browser entry for the Gravel Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runGravelCalculator, GRAVEL_DEFAULTS } from '../adapters/gravel.js';
import { gravelResults, gravelQuickResult, gravelAnnouncement } from '../components/gravel-results.js';
import { GRAVEL_FIELD_IDS } from '../components/gravel-form.js';

mountCalculator({
  defaults: GRAVEL_DEFAULTS,
  fieldIds: GRAVEL_FIELD_IDS,
  run: runGravelCalculator,
  render: gravelResults,
  quick: gravelQuickResult,
  announce: gravelAnnouncement
});

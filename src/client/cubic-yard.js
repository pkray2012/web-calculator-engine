/**
 * Browser entry for the Cubic Yard Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runCubicYardCalculator, CUBIC_YARD_DEFAULTS } from '../adapters/cubic-yard.js';
import { cubicYardResults, cubicYardQuickResult, cubicYardAnnouncement } from '../components/cubic-yard-results.js';
import { CUBIC_YARD_FIELD_IDS } from '../components/cubic-yard-form.js';

mountCalculator({
  defaults: CUBIC_YARD_DEFAULTS,
  fieldIds: CUBIC_YARD_FIELD_IDS,
  run: runCubicYardCalculator,
  render: cubicYardResults,
  quick: cubicYardQuickResult,
  announce: cubicYardAnnouncement
});

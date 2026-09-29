/**
 * Browser entry for the Flooring Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runFlooringCalculator, FLOORING_DEFAULTS } from '../adapters/flooring.js';
import { flooringResults, flooringQuickResult, flooringAnnouncement } from '../components/flooring-results.js';
import { FLOORING_FIELD_IDS } from '../components/flooring-form.js';

mountCalculator({
  defaults: FLOORING_DEFAULTS,
  fieldIds: FLOORING_FIELD_IDS,
  run: runFlooringCalculator,
  render: flooringResults,
  quick: flooringQuickResult,
  announce: flooringAnnouncement
});

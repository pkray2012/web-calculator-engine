/**
 * Browser entry for the Compound Interest Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runCompoundCalculator, COMPOUND_DEFAULTS } from '../adapters/compound-interest.js';
import { compoundResults, compoundQuickResult, compoundAnnouncement } from '../components/compound-results.js';
import { COMPOUND_FIELD_IDS } from '../components/compound-form.js';

mountCalculator({
  defaults: COMPOUND_DEFAULTS,
  fieldIds: COMPOUND_FIELD_IDS,
  run: runCompoundCalculator,
  render: compoundResults,
  quick: compoundQuickResult,
  announce: compoundAnnouncement
});

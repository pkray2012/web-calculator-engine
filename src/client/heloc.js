/**
 * Browser entry for the HELOC Payment Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runHelocCalculator, HELOC_DEFAULTS } from '../adapters/heloc.js';
import { helocResults, helocQuickResult, helocAnnouncement } from '../components/heloc-results.js';
import { HELOC_FIELD_IDS } from '../components/heloc-form.js';

mountCalculator({
  defaults: HELOC_DEFAULTS,
  fieldIds: HELOC_FIELD_IDS,
  run: runHelocCalculator,
  render: helocResults,
  quick: helocQuickResult,
  announce: helocAnnouncement
});

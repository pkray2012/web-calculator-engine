/**
 * Browser entry for the Asphalt Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runAsphaltCalculator, ASPHALT_DEFAULTS } from '../adapters/asphalt.js';
import { asphaltResults, asphaltQuickResult, asphaltAnnouncement } from '../components/asphalt-results.js';
import { ASPHALT_FIELD_IDS } from '../components/asphalt-form.js';

mountCalculator({
  defaults: ASPHALT_DEFAULTS,
  fieldIds: ASPHALT_FIELD_IDS,
  run: runAsphaltCalculator,
  render: asphaltResults,
  quick: asphaltQuickResult,
  announce: asphaltAnnouncement
});

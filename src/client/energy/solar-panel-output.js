/**
 * Browser entry for the Solar Panel Output Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runOutputCalculator, OUTPUT_DEFAULTS } from '../../adapters/energy/solar-panel-output.js';
import { outputResults, outputQuickResult, outputAnnouncement } from '../../components/energy/solar-panel-output-results.js';
import { OUTPUT_FIELD_IDS } from '../../components/energy/solar-panel-output-form.js';

mountCalculator({
  defaults: OUTPUT_DEFAULTS,
  fieldIds: OUTPUT_FIELD_IDS,
  run: runOutputCalculator,
  render: outputResults,
  quick: outputQuickResult,
  announce: outputAnnouncement
});

/**
 * Browser entry for the Solar Panel Size Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runSizeCalculator, SIZE_DEFAULTS } from '../../adapters/energy/solar-panel-size.js';
import { sizeResults, sizeQuickResult, sizeAnnouncement } from '../../components/energy/solar-panel-size-results.js';
import { SIZE_FIELD_IDS } from '../../components/energy/solar-panel-size-form.js';

mountCalculator({
  defaults: SIZE_DEFAULTS,
  fieldIds: SIZE_FIELD_IDS,
  run: runSizeCalculator,
  render: sizeResults,
  quick: sizeQuickResult,
  announce: sizeAnnouncement
});

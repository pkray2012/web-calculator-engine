/**
 * Browser entry for the Solar ROI Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runRoiCalculator, ROI_DEFAULTS } from '../../adapters/energy/solar-roi.js';
import { roiResults, roiQuickResult, roiAnnouncement } from '../../components/energy/solar-roi-results.js';
import { ROI_FIELD_IDS } from '../../components/energy/solar-roi-form.js';

mountCalculator({
  defaults: ROI_DEFAULTS,
  fieldIds: ROI_FIELD_IDS,
  run: runRoiCalculator,
  render: roiResults,
  quick: roiQuickResult,
  announce: roiAnnouncement
});

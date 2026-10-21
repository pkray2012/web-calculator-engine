/**
 * Browser entry for the Solar Payback Period Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runPaybackCalculator, PAYBACK_DEFAULTS } from '../../adapters/energy/solar-payback.js';
import { paybackResults, paybackQuickResult, paybackAnnouncement } from '../../components/energy/solar-payback-results.js';
import { PAYBACK_FIELD_IDS } from '../../components/energy/solar-payback-form.js';

mountCalculator({
  defaults: PAYBACK_DEFAULTS,
  fieldIds: PAYBACK_FIELD_IDS,
  run: runPaybackCalculator,
  render: paybackResults,
  quick: paybackQuickResult,
  announce: paybackAnnouncement
});

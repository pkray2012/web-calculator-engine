/**
 * Browser entry for the Tip Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runTipCalculator, TIP_DEFAULTS } from '../adapters/tip.js';
import { tipResults, tipQuickResult, tipAnnouncement } from '../components/tip-results.js';
import { TIP_FIELD_IDS } from '../components/tip-form.js';

mountCalculator({
  defaults: TIP_DEFAULTS,
  fieldIds: TIP_FIELD_IDS,
  run: runTipCalculator,
  render: tipResults,
  quick: tipQuickResult,
  announce: tipAnnouncement
});

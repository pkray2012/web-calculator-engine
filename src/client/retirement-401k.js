/**
 * Browser entry for the 401(k) Calculator.
 */

import { mountCalculator } from './calculator.js';
import { run401kCalculator, RETIREMENT_401K_DEFAULTS } from '../adapters/retirement-401k.js';
import { retirement401kResults, retirement401kQuickResult, retirement401kAnnouncement } from '../components/retirement-401k-results.js';
import { RETIREMENT_401K_FIELD_IDS } from '../components/retirement-401k-form.js';

mountCalculator({
  defaults: RETIREMENT_401K_DEFAULTS,
  fieldIds: RETIREMENT_401K_FIELD_IDS,
  run: run401kCalculator,
  render: retirement401kResults,
  quick: retirement401kQuickResult,
  announce: retirement401kAnnouncement
});

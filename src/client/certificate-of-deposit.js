/**
 * Browser entry for the CD Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runCdCalculator, CD_DEFAULTS } from '../adapters/certificate-of-deposit.js';
import { cdResults, cdQuickResult, cdAnnouncement } from '../components/cd-results.js';
import { CD_FIELD_IDS } from '../components/cd-form.js';

mountCalculator({
  defaults: CD_DEFAULTS,
  fieldIds: CD_FIELD_IDS,
  run: runCdCalculator,
  render: cdResults,
  quick: cdQuickResult,
  announce: cdAnnouncement
});

/**
 * Browser entry for the Debt-to-Income Ratio Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runDtiCalculator, DTI_DEFAULTS } from '../adapters/debt-to-income.js';
import { dtiResults, dtiQuickResult, dtiAnnouncement } from '../components/dti-results.js';
import { DTI_FIELD_IDS } from '../components/dti-form.js';

mountCalculator({
  defaults: DTI_DEFAULTS,
  fieldIds: DTI_FIELD_IDS,
  run: runDtiCalculator,
  render: dtiResults,
  quick: dtiQuickResult,
  announce: dtiAnnouncement
});

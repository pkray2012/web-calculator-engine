/**
 * Browser entry for the Electric Bill Calculator.
 */

import { mountCalculator } from '../calculator.js';
import { runBillCalculator, BILL_DEFAULTS } from '../../adapters/energy/electric-bill.js';
import { billResults, billQuickResult, billAnnouncement } from '../../components/energy/electric-bill-results.js';
import { BILL_FIELD_IDS } from '../../components/energy/electric-bill-form.js';

mountCalculator({
  defaults: BILL_DEFAULTS,
  fieldIds: BILL_FIELD_IDS,
  run: runBillCalculator,
  render: billResults,
  quick: billQuickResult,
  announce: billAnnouncement
});

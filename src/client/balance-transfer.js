/**
 * Browser entry for the Balance Transfer Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runTransferCalculator, TRANSFER_DEFAULTS } from '../adapters/balance-transfer.js';
import { balanceTransferResults, balanceTransferQuickResult, balanceTransferAnnouncement } from '../components/balance-transfer-results.js';
import { TRANSFER_FIELD_IDS } from '../components/balance-transfer-form.js';

mountCalculator({
  defaults: TRANSFER_DEFAULTS,
  fieldIds: TRANSFER_FIELD_IDS,
  run: runTransferCalculator,
  render: balanceTransferResults,
  quick: balanceTransferQuickResult,
  announce: balanceTransferAnnouncement
});

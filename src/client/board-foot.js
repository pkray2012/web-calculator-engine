/**
 * Browser entry for the Board Foot Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runBoardFootCalculator, BOARD_FOOT_DEFAULTS } from '../adapters/board-foot.js';
import { boardFootResults, boardFootQuickResult, boardFootAnnouncement } from '../components/board-foot-results.js';
import { BOARD_FOOT_FIELD_IDS } from '../components/board-foot-form.js';

mountCalculator({
  defaults: BOARD_FOOT_DEFAULTS,
  fieldIds: BOARD_FOOT_FIELD_IDS,
  run: runBoardFootCalculator,
  render: boardFootResults,
  quick: boardFootQuickResult,
  announce: boardFootAnnouncement
});

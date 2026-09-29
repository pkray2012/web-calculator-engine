import test from 'node:test';
import assert from 'node:assert/strict';

import { parseBoardFootForm, runBoardFootCalculator, parseThickness, BOARD_FOOT_DEFAULTS } from '../../src/adapters/board-foot.js';
import { boardFootResults, boardFootQuickResult, boardFootAnnouncement } from '../../src/components/board-foot-results.js';
import { boardFootForm, BOARD_FOOT_FIELD_IDS } from '../../src/components/board-foot-form.js';

function view(values) {
  const result = runBoardFootCalculator({ ...BOARD_FOOT_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: 40 + 33.33 = 73.33 bd ft, 84.33 with 15% extra', () => {
  const result = view({});
  assert.ok(Math.abs(result.total - 73.33333333333333) < 1e-9);
  assert.match(String(boardFootQuickResult(result)), /84\.33 bd ft/);
  assert.equal(boardFootAnnouncement(result), '73.33 bd ft of lumber, 84.33 bd ft with 15% extra.');
  const markup = String(boardFootResults(result));
  assert.match(markup, /5\/4 in × 8 in × 10 ft/);
  assert.match(markup, /Add a price per board foot/);
});

test('quarter sizes and decimals parse', () => {
  assert.deepEqual(parseThickness('8/4', 't'), { value: 2 });
  assert.deepEqual(parseThickness('5 / 4', 't'), { value: 1.25 });
  assert.deepEqual(parseThickness('1.5', 't'), { value: 1.5 });
  assert.ok(parseThickness('', 'Row 1 thickness').error);
  assert.ok(parseThickness('0/4', 't').error);
});

test('blank optional stacks are skipped; a half-filled stack is an error', () => {
  assert.equal(view({ row2Quantity: '', row2Thickness: '', row2Width: '', row2Length: '' }).rows.length, 1);
  assert.deepEqual(Object.keys(parseBoardFootForm({ ...BOARD_FOOT_DEFAULTS, row3Quantity: '2' }).errors).sort(), ['row3Length', 'row3Thickness', 'row3Width']);
  assert.deepEqual(Object.keys(parseBoardFootForm({ ...BOARD_FOOT_DEFAULTS, row1Quantity: '1.5' }).errors), ['row1Quantity']);
});

test('price adds the cost', () => {
  assert.ok(Math.abs(view({ pricePerBoardFoot: '6.50' }).cost - 84.33333333333333 * 6.5) < 1e-9);
});

test('form renders every field id', () => {
  const markup = String(boardFootForm());
  for (const id of Object.values(BOARD_FOOT_FIELD_IDS)) assert.match(markup, new RegExp(`id="${id}"`));
});

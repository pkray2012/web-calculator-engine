import test from 'node:test';
import assert from 'node:assert/strict';

import { parseTimeCardForm, runTimeCardCalculator, parseTime, TIME_CARD_DEFAULTS } from '../../src/adapters/time-card.js';
import { timeCardResults, timeCardQuickResult, timeCardAnnouncement } from '../../src/components/time-card-results.js';
import { timeCardForm, TIME_CARD_FIELD_IDS } from '../../src/components/time-card-form.js';

function view(values) {
  const result = runTimeCardCalculator({ ...TIME_CARD_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: 45 hours, 5 overtime, $950 gross (reference in tests/time-card.test.js)', () => {
  const result = view({});
  assert.equal(result.totalMinutes, 2700);
  assert.equal(result.pay.total, 950);
  assert.match(String(timeCardQuickResult(result)), /45:00 \(45\.00 h\)/);
  assert.equal(timeCardAnnouncement(result), '45:00 (45.00 h) worked, including 5.00 overtime hours. Gross pay $950.00.');
  const markup = String(timeCardResults(result));
  assert.match(markup, /8:00 AM – 5:30 PM/);
  assert.match(markup, /id="tc-days"/);
});

test('a weekend overnight shift and no rate', () => {
  const result = view({ satStart: '22:00', satEnd: '06:30', satBreak: '30', hourlyRate: '' });
  assert.equal(result.totalMinutes, 2700 + 480);
  assert.equal(result.pay, null);
  assert.match(String(timeCardResults(result)), /10:00 PM – 6:30 AM \(next day\)/);
});

test('parseTime accepts HH:MM and rejects the rest', () => {
  assert.deepEqual(parseTime('08:30', 'x'), { value: 510 });
  assert.deepEqual(parseTime('', 'x'), { value: null });
  assert.ok(parseTime('25:00', 'Monday start').error);
  assert.ok(parseTime('8am', 'Monday start').error);
});

test('errors: half-filled day, break too long, empty week', () => {
  assert.deepEqual(Object.keys(parseTimeCardForm({ ...TIME_CARD_DEFAULTS, satStart: '09:00' }).errors), ['satEnd']);
  assert.match(parseTimeCardForm({ ...TIME_CARD_DEFAULTS, monBreak: '600' }).errors.monBreak, /shorter than the shift/);
  const empty = Object.fromEntries(Object.keys(TIME_CARD_DEFAULTS).map((key) => [key, '']));
  assert.match(parseTimeCardForm(empty).errors.monStart, /at least one day/);
});

test('form renders every field id with time inputs for start and end', () => {
  const markup = String(timeCardForm());
  for (const id of Object.values(TIME_CARD_FIELD_IDS)) assert.match(markup, new RegExp(`id="${id}"`));
  assert.match(markup, /id="tc-mon-start" name="monStart" type="time"/);
});

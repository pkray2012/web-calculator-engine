import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTimeCard, shiftMinutes, hoursAndMinutes, decimalHours } from '../src/calculators/time-card.js';

const t = (hh, mm = 0) => hh * 60 + mm;

// Hand-checked: 8:00 to 17:30 with a 30-minute lunch is 9 hours.
test('five 9-hour days: 45 hours, 5 of them overtime at time and a half', () => {
  const day = { start: t(8), end: t(17, 30), breakMinutes: 30 };
  const result = calculateTimeCard({ days: [day, day, day, day, day, null, null], hourlyRate: 20 });
  assert.equal(result.totalMinutes, 45 * 60);
  assert.equal(result.regularMinutes, 40 * 60);
  assert.equal(result.overtimeMinutes, 5 * 60);
  assert.equal(result.daysWorked, 5);
  assert.deepEqual(result.pay, { regular: 800, overtime: 150, total: 950 });
});

test('an overnight shift ends the next day', () => {
  assert.deepEqual(shiftMinutes({ start: t(22), end: t(6), breakMinutes: 30 }), { span: 480, worked: 450, overnight: true });
  // A start and end at the same time is a full 24-hour shift.
  assert.equal(shiftMinutes({ start: t(7), end: t(7) }).span, 1440);
});

test('odd minutes add up exactly and convert to decimal hours', () => {
  const days = [{ start: t(8, 7), end: t(16, 52), breakMinutes: 33 }, { start: t(9, 15), end: t(13, 4) }];
  const result = calculateTimeCard({ days });
  // 525 − 33 = 492 and 229 minutes: 721 minutes = 12:01 = 12.0167 h.
  assert.equal(result.totalMinutes, 721);
  assert.equal(hoursAndMinutes(result.totalMinutes), '12:01');
  assert.ok(Math.abs(decimalHours(721) - 12.016666666666667) < 1e-12);
  assert.equal(result.overtimeMinutes, 0);
  assert.equal(result.pay, null);
});

test('custom overtime threshold and multiplier', () => {
  const day = { start: t(6), end: t(18), breakMinutes: 60 }; // 11 h
  const result = calculateTimeCard({ days: [day, day, day, day], overtimeAfterHours: 37.5, hourlyRate: 24, overtimeMultiplier: 2 });
  assert.equal(result.totalMinutes, 44 * 60);
  assert.equal(result.overtimeMinutes, 6.5 * 60);
  assert.deepEqual(result.pay, { regular: 900, overtime: 312, total: 1212 });
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateTimeCard({ days: [null, null] }), RangeError);
  assert.throws(() => shiftMinutes({ start: t(9), end: t(10), breakMinutes: 60 }), RangeError);
  assert.throws(() => shiftMinutes({ start: 1440, end: t(10) }), RangeError);
  assert.throws(() => calculateTimeCard({ days: [{ start: t(9), end: t(17) }], overtimeMultiplier: 0.5 }), RangeError);
});

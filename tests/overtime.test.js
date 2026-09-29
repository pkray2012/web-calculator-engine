import test from 'node:test';
import assert from 'node:assert/strict';
import { weeklyOvertime } from '../src/calculators/overtime.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test('federal: 45 hours at $20 is 40 regular and 5 at time and a half', () => {
  const result = weeklyOvertime({ hourlyRate: 20, hours: [9, 9, 9, 9, 9, 0, 0] });
  assert.equal(result.regularHours, 40);
  assert.equal(result.overtimeHours, 5);
  close(result.overtimeRate, 30);
  close(result.totalPay, 40 * 20 + 5 * 30);
  close(result.overtimePremium, 50);
  // The hours past 40 are the last ones worked.
  assert.deepEqual(result.days.map((d) => d.overtime), [0, 0, 0, 0, 5, 0, 0]);
});

test('federal: long days alone are not overtime, and a higher multiplier is allowed', () => {
  assert.equal(weeklyOvertime({ hourlyRate: 20, hours: [10, 10, 10, 10, 0, 0, 0] }).overtimeHours, 0);
  close(weeklyOvertime({ hourlyRate: 20, hours: [10, 10, 10, 10, 10, 0, 0], overtimeMultiplier: 2 }).totalPay, 40 * 20 + 10 * 40);
});

test('california: four 10-hour days are 32 regular and 8 overtime', () => {
  const result = weeklyOvertime({ hourlyRate: 20, hours: [10, 10, 10, 10, 0, 0, 0], rule: 'california' });
  assert.equal(result.regularHours, 32);
  assert.equal(result.overtimeHours, 8);
  close(result.totalPay, 32 * 20 + 8 * 30);
});

test('california: a 14-hour day has 4 overtime and 2 double-time hours', () => {
  const result = weeklyOvertime({ hourlyRate: 25, hours: [14, 0, 0, 0, 0, 0, 0], rule: 'california' });
  assert.deepEqual([result.regularHours, result.overtimeHours, result.doubleTimeHours], [8, 4, 2]);
  close(result.totalPay, 8 * 25 + 4 * 37.5 + 2 * 50);
});

test('california: daily overtime hours do not count again toward the weekly 40', () => {
  // Six 9-hour days: 48 regular-capped hours → 8 per day = 48 regular, over 40 by 8; plus 6 daily OT.
  const result = weeklyOvertime({ hourlyRate: 20, hours: [9, 9, 9, 9, 9, 9, 0], rule: 'california' });
  assert.equal(result.regularHours, 40);
  assert.equal(result.overtimeHours, 6 + 8);
  assert.equal(result.doubleTimeHours, 0);
  assert.equal(result.days[5].weeklyOvertime, 8);
});

test('california: seventh consecutive day, first 8 at 1.5× and the rest at 2×', () => {
  const result = weeklyOvertime({ hourlyRate: 20, hours: [8, 8, 8, 8, 8, 4, 10], rule: 'california' });
  assert.equal(result.seventhDayApplied, true);
  assert.deepEqual([result.days[6].overtime, result.days[6].doubleTime], [8, 2]);
  // Days 1–6: 44 regular-capped hours; 4 move to weekly overtime.
  assert.equal(result.regularHours, 40);
  assert.equal(result.overtimeHours, 4 + 8);
  assert.equal(result.doubleTimeHours, 2);
  close(result.totalPay, 40 * 20 + 12 * 30 + 2 * 40);
});

test('california: the seventh-day rule needs all seven days worked', () => {
  const result = weeklyOvertime({ hourlyRate: 20, hours: [0, 8, 8, 8, 8, 8, 8], rule: 'california' });
  assert.equal(result.seventhDayApplied, false);
  assert.equal(result.regularHours, 40);
  assert.equal(result.overtimeHours, 8);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => weeklyOvertime({ hourlyRate: 20, hours: [8, 8, 8] }), RangeError);
  assert.throws(() => weeklyOvertime({ hourlyRate: 20, hours: [25, 0, 0, 0, 0, 0, 0] }), RangeError);
  assert.throws(() => weeklyOvertime({ hourlyRate: -1, hours: [8, 8, 8, 8, 8, 0, 0] }), RangeError);
  assert.throws(() => weeklyOvertime({ hourlyRate: 20, hours: [8, 8, 8, 8, 8, 0, 0], overtimeMultiplier: 1.2 }), RangeError);
  // @ts-expect-error unknown rule
  assert.throws(() => weeklyOvertime({ hourlyRate: 20, hours: [8, 8, 8, 8, 8, 0, 0], rule: 'texas' }), RangeError);
});

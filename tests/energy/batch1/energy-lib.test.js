import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moneyField } from '../../../src/lib/energy/money.js';
import { plainDecimal, roundHalfUp, formatShare, formatKwh, formatHours, formatCentsAndDollars } from '../../../src/lib/energy/format.js';

const money = (raw, rules = {}) => moneyField(raw, { label: 'Price', ...rules });

test('money text becomes whole cents', () => {
  assert.deepEqual(money('120'), { value: 12000 });
  assert.deepEqual(money('$1,234.56'), { value: 123456 });
  assert.deepEqual(money('0.10'), { value: 10 });
  assert.deepEqual(money('.5'), { value: 50 });
  assert.deepEqual(money('7.'), { value: 700 });
  assert.deepEqual(money('1.250'), { value: 125 }, 'trailing zeros are not extra decimals');
  assert.deepEqual(money('-0'), { value: 0 });
  assert.deepEqual(money('0.29'), { value: 29 }, 'no float error: 0.29 × 100 is 28.999…');
});

test('money rejects sub-cent amounts, non-numbers and out-of-range values', () => {
  assert.equal(money('0.001').error, 'Enter dollars and cents, for example 1.25.');
  assert.equal(money('1e3').error, 'Price must be a number.');
  assert.equal(money('Infinity').error, 'Price must be a number.');
  assert.equal(money('-5').error, 'Price cannot be negative.');
  assert.equal(money('0', { min: 0.01 }).error, 'Price must be at least 0.01.');
  assert.equal(money('1000000.01', { max: 1_000_000 }).error, 'Price must be 1,000,000 or less.');
  assert.equal(money('9'.repeat(309), { max: 1_000_000 }).error, 'Price must be 1,000,000 or less.');
  assert.equal(money('9'.repeat(309)).error, 'Price must be a smaller number.');
  assert.equal(money('').error, 'Price is required.');
  assert.deepEqual(money(' ', { required: false, fallback: null }), { value: null });
});

test('plain decimals never use exponent notation', () => {
  assert.equal(plainDecimal(1e21), '1000000000000000000000');
  assert.equal(plainDecimal(1.5e-7), '0.00000015');
  assert.equal(plainDecimal(-2.5e-8), '-0.000000025');
  assert.equal(Number(plainDecimal(5e-324)), 5e-324);
});

test('display rounding is half up on the shortest decimal', () => {
  assert.equal(roundHalfUp(0.0445, 3), '0.045', 'toFixed would give 0.044');
  assert.equal(roundHalfUp(1.005, 2), '1.01');
  assert.equal(roundHalfUp(-0.004, 2), '0.00', 'no negative zero');
  assert.equal(roundHalfUp(1234567.891, 2), '1,234,567.89');
  assert.equal(roundHalfUp(0.0445, 2, { shift: 2 }), '4.45');
  assert.equal(formatShare(100), '100.0%');
  assert.equal(formatShare(34.285714285714285), '34.3%');
  assert.equal(formatKwh(0), '0.00 kWh');
  assert.equal(formatKwh(0.004), 'less than 0.01 kWh');
  assert.equal(formatKwh(45), '45.00 kWh');
  assert.equal(formatHours(0), '0 min');
  assert.equal(formatHours(0.005), 'less than 1 min');
  assert.equal(formatHours(40 / 60), '40 min');
  assert.equal(formatHours(7 / 1.5), '4 h 40 min');
  assert.equal(formatHours(50), '50 h 0 min (2.08 days)');
  assert.equal(formatCentsAndDollars(0.0445), '4.45¢ ($0.045)');
});

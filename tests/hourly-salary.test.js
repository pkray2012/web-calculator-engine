import test from 'node:test';
import assert from 'node:assert/strict';
import { convertPay, PAY_PERIODS } from '../src/calculators/hourly-salary.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('$25 an hour full time is $52,000 a year (25 × 40 × 52)', () => {
  const { pay, hoursPerYear, effectiveHourly } = convertPay({ amount: 25, period: 'hour' });
  assert.equal(hoursPerYear, 2080);
  assert.equal(pay.year, 52_000);
  assert.equal(pay.week, 1000);
  assert.equal(pay.day, 200);
  assert.equal(pay.biweek, 2000);
  close(pay.semimonth, 52_000 / 24);
  close(pay.month, 52_000 / 12);
  assert.equal(effectiveHourly, 25);
});

test('$60,000 a year is $28.85 an hour on 2,080 hours', () => {
  const { pay } = convertPay({ amount: 60_000, period: 'year' });
  close(pay.hour, 60_000 / 2080);
  assert.equal(pay.hour.toFixed(2), '28.85');
  close(pay.week, 60_000 / 52);
});

test('paycheck periods convert through 26, 24 and 12 paychecks a year', () => {
  assert.equal(convertPay({ amount: 2000, period: 'biweek' }).pay.year, 52_000);
  assert.equal(convertPay({ amount: 2500, period: 'semimonth' }).pay.year, 60_000);
  assert.equal(convertPay({ amount: 5000, period: 'month' }).pay.year, 60_000);
  assert.equal(convertPay({ amount: 1200, period: 'week' }).pay.year, 62_400);
  assert.equal(convertPay({ amount: 160, period: 'day' }).pay.year, 41_600);
});

test('unpaid weeks off lower annual pay; paycheck amounts average across the year', () => {
  const { pay } = convertPay({ amount: 25, period: 'hour', weeksPerYear: 50 });
  assert.equal(pay.year, 50_000);
  assert.equal(pay.week, 1000);
  close(pay.biweek, 50_000 / 26);
  // Back from the annual figure recovers the same hourly rate.
  close(convertPay({ amount: 50_000, period: 'year', weeksPerYear: 50 }).pay.hour, 25);
});

test('paid days off keep pay but raise the rate per hour actually worked', () => {
  const result = convertPay({ amount: 60_000, period: 'year', paidDaysOff: 25 });
  assert.equal(result.hoursWorked, 2080 - 25 * 8);
  close(result.effectiveHourly, 60_000 / 1880);
  assert.equal(result.effectiveHourly.toFixed(2), '31.91');
  close(result.pay.hour, 60_000 / 2080);
});

test('overtime hours are paid at the multiple of the regular rate', () => {
  const result = convertPay({ amount: 20, period: 'hour', overtimeHours: 5 });
  assert.equal(result.pay.year, 20 * (40 + 5 * 1.5) * 52);
  assert.equal(result.pay.year, 49_400);
  assert.equal(result.overtimePay, 20 * 1.5 * 5 * 52);
  assert.equal(result.hoursPerYear, 45 * 52);
  // A salary with overtime solves for the regular rate.
  close(convertPay({ amount: 49_400, period: 'year', overtimeHours: 5 }).pay.hour, 20);
  // Double time.
  assert.equal(convertPay({ amount: 20, period: 'hour', overtimeHours: 5, overtimeMultiplier: 2 }).pay.year, 20 * 50 * 52);
});

test('part-time schedule: 24 hours over 3 days', () => {
  const { pay } = convertPay({ amount: 18, period: 'hour', hoursPerWeek: 24, daysPerWeek: 3 });
  assert.equal(pay.week, 432);
  assert.equal(pay.day, 144);
  assert.equal(pay.year, 22_464);
});

test('round trip: any period converts back to itself for random schedules', () => {
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const periods = Object.keys(PAY_PERIODS);
  for (let i = 0; i < 2000; i++) {
    const schedule = {
      hoursPerWeek: 1 + Math.floor(rand() * 60),
      daysPerWeek: 1 + Math.floor(rand() * 7),
      weeksPerYear: 1 + Math.floor(rand() * 52),
      overtimeHours: Math.floor(rand() * 20),
      overtimeMultiplier: 1 + Math.round(rand() * 10) / 10
    };
    const from = periods[Math.floor(rand() * periods.length)];
    const amount = Math.round(rand() * 1e7) / 100;
    const { pay } = convertPay({ amount, period: from, ...schedule });
    for (const to of periods) {
      const back = convertPay({ amount: pay[to], period: to, ...schedule }).pay[from];
      assert.ok(Math.abs(back - amount) <= 1e-9 * Math.max(1, amount), `${from}→${to}→${from}: ${back} vs ${amount}`);
    }
    // Independent check of the headline formula.
    const hourly = pay.hour;
    const expectedAnnual = hourly * (schedule.hoursPerWeek + schedule.overtimeHours * schedule.overtimeMultiplier) * schedule.weeksPerYear;
    assert.ok(Math.abs(pay.year - expectedAnnual) <= 1e-9 * Math.max(1, pay.year));
  }
});

test('zero pay is allowed and rejects invalid schedules', () => {
  assert.equal(convertPay({ amount: 0, period: 'hour' }).pay.year, 0);
  assert.throws(() => convertPay({ amount: -1, period: 'hour' }), RangeError);
  assert.throws(() => convertPay({ amount: 10, period: 'fortnight' }), RangeError);
  assert.throws(() => convertPay({ amount: 10, period: 'hour', hoursPerWeek: 0 }), RangeError);
  assert.throws(() => convertPay({ amount: 10, period: 'hour', weeksPerYear: 53 }), RangeError);
  assert.throws(() => convertPay({ amount: 10, period: 'hour', daysPerWeek: 8 }), RangeError);
  assert.throws(() => convertPay({ amount: 10, period: 'hour', hoursPerWeek: 160, overtimeHours: 10 }), RangeError);
  assert.throws(() => convertPay({ amount: 10, period: 'hour', overtimeMultiplier: 0.5 }), RangeError);
  assert.throws(() => convertPay({ amount: 10, period: 'hour', paidDaysOff: 260 }), RangeError);
  assert.throws(() => convertPay({ amount: NaN, period: 'hour' }), RangeError);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCd, apyFromRate, rateFromApy } from '../src/calculators/certificate-of-deposit.js';

const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

// References from an independent Python calculation with 40-digit decimals.
test('a 4.00% APY on $10,000 for 12 months earns exactly $400', () => {
  const result = calculateCd({ deposit: 10000, ratePercent: 4, rateType: 'apy', compounding: 'daily', termMonths: 12 });
  close(result.maturityValue, 10400);
  close(result.interest, 400);
  assert.equal(result.schedule.length, 1);
});

test('5% stated rate compounded daily for 18 months', () => {
  const result = calculateCd({ deposit: 10000, ratePercent: 5, rateType: 'apr', compounding: 'daily', termMonths: 18, taxPercent: 22 });
  close(result.apy, 0.0512674964675);
  close(result.maturityValue, 10778.7861433);
  close(result.interest, 778.786143283504);
  close(result.afterTaxInterest, 778.786143283504 * 0.78);
  // Year-end balance, then the maturity month.
  assert.deepEqual(result.schedule.map((row) => row.month), [12, 18]);
  close(result.schedule[0].balance, 10512.6749647);
  close(result.schedule[1].balance, 10778.7861433);
});

test('the same stated rate at each compounding frequency', () => {
  const values = Object.fromEntries(calculateCd({ deposit: 10000, ratePercent: 5, rateType: 'apr', compounding: 'monthly', termMonths: 12 }).byCompounding.map((row) => [row.compounding, row.maturityValue]));
  close(values.daily, 10512.6749647);
  close(values.monthly, 10511.6189788);
  close(values.quarterly, 10509.4533691);
  close(values.annually, 10500);
});

test('early withdrawal: 5-year CD at 4.5% APY cashed in after 6 months with a 6-month penalty', () => {
  const result = calculateCd({ deposit: 25000, ratePercent: 4.5, rateType: 'apy', compounding: 'monthly', termMonths: 60, penaltyMonths: 6, withdrawMonth: 6 });
  close(result.statedRate, 0.0440977128052);
  close(result.maturityValue, 31154.5484413);
  const early = result.earlyWithdrawal;
  close(early.balance, 25556.3103753);
  close(early.penalty, 551.221410065515);
  close(early.received, 25005.0889653);
  assert.equal(early.losesPrincipal, false);
});

test('a penalty larger than the interest earned eats into the deposit', () => {
  const early = calculateCd({ deposit: 10000, ratePercent: 4, rateType: 'apy', compounding: 'daily', termMonths: 24, penaltyMonths: 12, withdrawMonth: 1 }).earlyWithdrawal;
  close(early.penalty, 392.228204401844);
  close(early.received, 9640.50919342);
  assert.equal(early.losesPrincipal, true);
});

test('APY and stated rate convert both ways', () => {
  for (const n of [365, 12, 4, 1]) close(apyFromRate(rateFromApy(0.0437, n), n), 0.0437, 1e-12);
});

test('invalid inputs are rejected', () => {
  const base = { deposit: 1000, ratePercent: 4, rateType: 'apy', compounding: 'daily', termMonths: 12 };
  assert.throws(() => calculateCd({ ...base, deposit: 0 }), RangeError);
  assert.throws(() => calculateCd({ ...base, termMonths: 1.5 }), RangeError);
  assert.throws(() => calculateCd({ ...base, compounding: 'hourly' }), RangeError);
  assert.throws(() => calculateCd({ ...base, withdrawMonth: 12 }), RangeError);
  assert.throws(() => calculateCd({ ...base, taxPercent: 120 }), RangeError);
});

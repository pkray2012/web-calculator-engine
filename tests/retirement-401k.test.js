import test from 'node:test';
import assert from 'node:assert/strict';
import { project401k, deferralLimit, catchUpLimit, matchPercentOfPay, LIMITS_2026 } from '../src/calculators/retirement-401k.js';

const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);
const SAFE_HARBOR = { match1Rate: 100, match1UpTo: 3, match2Rate: 50, match2UpTo: 2 };

test('2026 limits: $24,500 base, $8,000 catch-up at 50+, $11,250 at 60 to 63, $72,000 annual additions', () => {
  assert.equal(LIMITS_2026.electiveDeferral, 24_500);
  assert.equal(deferralLimit(49), 24_500);
  assert.equal(deferralLimit(50), 32_500);
  assert.equal(deferralLimit(59), 32_500);
  assert.equal(deferralLimit(60), 35_750);
  assert.equal(deferralLimit(63), 35_750);
  assert.equal(deferralLimit(64), 32_500);
  assert.equal(catchUpLimit(30), 0);
  assert.equal(LIMITS_2026.annualAdditions, 72_000);
});

test('tiered match: 100% of the first 3% and 50% of the next 2%', () => {
  close(matchPercentOfPay(0, SAFE_HARBOR), 0);
  close(matchPercentOfPay(2, SAFE_HARBOR), 0.02);
  close(matchPercentOfPay(3, SAFE_HARBOR), 0.03);
  close(matchPercentOfPay(4, SAFE_HARBOR), 0.035);
  close(matchPercentOfPay(5, SAFE_HARBOR), 0.04);
  close(matchPercentOfPay(15, SAFE_HARBOR), 0.04);
});

test('with no return the balance is the sum of contributions: $60,000 at 10% with a 4% match for 25 years', () => {
  const result = project401k({ currentAge: 30, retirementAge: 55, salary: 60_000, contributionPercent: 10, currentBalance: 5000, ...SAFE_HARBOR });
  close(result.firstYearEmployee, 6000);
  close(result.firstYearEmployer, 2400);
  close(result.balance, 5000 + 25 * 8400);
  close(result.growth, 0);
  assert.equal(result.schedule.length, 25);
  assert.equal(result.limitYears, 0);
  close(result.firstYearMatchMissed, 0);
});

test('level contributions match the future value of an ordinary annuity, compounded monthly', () => {
  const result = project401k({ currentAge: 35, retirementAge: 65, salary: 72_000, contributionPercent: 6, currentBalance: 20_000, annualReturn: 7, ...SAFE_HARBOR });
  const i = 1.07 ** (1 / 12) - 1;
  const n = 360;
  const monthly = 6000 * (0.06 + 0.04);
  close(result.balance, 20_000 * (1 + i) ** n + monthly * ((1 + i) ** n - 1) / i, 1e-4);
  close(result.employeeTotal, 30 * 4320);
  close(result.employerTotal, 30 * 2880);
});

test('salary growth raises each year\'s contributions', () => {
  const result = project401k({ currentAge: 40, retirementAge: 43, salary: 50_000, contributionPercent: 10, salaryGrowth: 3 });
  close(result.schedule[0].employee, 5000);
  close(result.schedule[1].employee, 5150);
  close(result.schedule[2].employee, 5304.5);
  close(result.schedule[2].salary, 53_045);
});

test('deferrals stop at the annual limit, and the per-paycheck match stops with them', () => {
  // $300,000 at 10% wants $30,000; $2,500 a month reaches $24,500 in month 10.
  const result = project401k({ currentAge: 40, retirementAge: 41, salary: 300_000, contributionPercent: 10, ...SAFE_HARBOR });
  close(result.firstYearEmployee, 24_500);
  assert.equal(result.schedule[0].limitMonth, 10);
  // $1,000 a month of match for 10 months, then none.
  close(result.firstYearEmployer, 10_000);
  close(result.firstYearMatchMissed, 2000);
  assert.equal(result.limitYears, 1);
});

test('the catch-up raises the limit from the year the employee turns 50, and more at 60 to 63', () => {
  const result = project401k({ currentAge: 49, retirementAge: 65, salary: 500_000, contributionPercent: 20 });
  assert.deepEqual(result.schedule.map((row) => Math.round(row.employee)), [
    24_500, 32_500, 32_500, 32_500, 32_500, 32_500, 32_500, 32_500, 32_500, 32_500, 32_500, 35_750, 35_750, 35_750, 35_750, 32_500
  ]);
});

test('employer money is capped so deferrals (excluding catch-up) plus employer total $72,000', () => {
  // $50,000 a month; a $24,500 deferral in month 1 is 49% of pay, matched 200% = $49,000, capped at $47,500.
  const result = project401k({ currentAge: 55, retirementAge: 56, salary: 600_000, contributionPercent: 50, match1Rate: 200, match1UpTo: 50 });
  close(result.firstYearEmployee, 32_500);
  close(result.firstYearEmployer, 72_000 - 24_500);
});

test('a large early match cannot push later deferrals past the $72,000 total; over 50 the excess becomes catch-up', () => {
  // $50,000 a month, 2% deferred ($1,000) and matched 1,000% ($10,000): $11,000 a month uses the $72,000 room in month 7.
  const input = { salary: 600_000, contributionPercent: 2, match1Rate: 1000, match1UpTo: 2 };
  const young = project401k({ ...input, currentAge: 40, retirementAge: 41 });
  close(young.firstYearEmployee, 7000);
  close(young.firstYearEmployer, 65_000);
  assert.equal(young.schedule[0].limitMonth, 8);
  const older = project401k({ ...input, currentAge: 55, retirementAge: 56 });
  close(older.firstYearEmployee, 12_000);
  close(older.schedule[0].catchUp, 5000);
  close(older.firstYearEmployer, 65_000);
});

test('today\'s-dollars value discounts the balance by inflation over the years to retirement', () => {
  const result = project401k({ currentAge: 30, retirementAge: 40, salary: 50_000, contributionPercent: 10, annualReturn: 5, inflation: 3 });
  close(result.realBalance, result.balance / 1.03 ** 10);
});

test('an independent year-by-year check of a combined case', () => {
  const input = { currentAge: 58, retirementAge: 62, salary: 180_000, contributionPercent: 15, currentBalance: 250_000, annualReturn: 6, salaryGrowth: 2, ...SAFE_HARBOR };
  const result = project401k(input);
  let balance = 250_000;
  let salary = 180_000;
  const i = 1.06 ** (1 / 12) - 1;
  for (let y = 0; y < 4; y += 1) {
    if (y > 0) salary *= 1.02;
    const limit = [32_500, 32_500, 35_750, 35_750][y];
    let deferred = 0;
    for (let m = 0; m < 12; m += 1) {
      const d = Math.min(salary / 12 * 0.15, limit - deferred);
      deferred += d;
      const pct = d / (salary / 12) * 100;
      const matchPct = Math.min(pct, 3) + 0.5 * Math.min(Math.max(pct - 3, 0), 2);
      balance = balance * (1 + i) + d + salary / 12 * matchPct / 100;
    }
  }
  close(result.balance, balance, 1e-6);
});

test('invalid input is rejected', () => {
  assert.throws(() => project401k({ currentAge: 40, retirementAge: 40, salary: 50_000, contributionPercent: 5 }), RangeError);
  assert.throws(() => project401k({ currentAge: 40, retirementAge: 65, salary: -1, contributionPercent: 5 }), RangeError);
  assert.throws(() => project401k({ currentAge: 40, retirementAge: 65, salary: 50_000, contributionPercent: 101 }), RangeError);
});

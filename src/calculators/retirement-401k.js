/**
 * 401(k) balance projection: a month-by-month simulation of employee
 * deferrals, a tiered employer match and investment growth, with the IRS
 * annual limits for 2026.
 *
 * Model (all rates annual, entered as percentages):
 * - Salary is paid in 12 equal monthly paychecks and rises by `salaryGrowth`
 *   at the start of each year after the first.
 * - Each paycheck the employee defers `contributionPercent` of pay until the
 *   year's elective deferral limit is reached. The limit depends on the age
 *   reached that year: the base limit, plus the age 50+ catch-up, or the larger
 *   age 60 to 63 catch-up instead.
 * - The employer matches each paycheck's deferral: `match1Rate`% of the
 *   deferral up to `match1UpTo`% of pay, plus `match2Rate`% of the deferral on
 *   the next `match2UpTo`% of pay. The match stops when deferrals stop; there
 *   is no year-end true-up.
 * - Employee deferrals excluding catch-up plus employer contributions are
 *   capped at the section 415(c) annual additions limit.
 * - The balance grows at `annualReturn`, compounded monthly; contributions are
 *   added at the end of each month.
 * - Limits stay at their 2026 amounts; in practice the IRS raises them with
 *   inflation most years.
 */

/** IRS limits for 2026 (IRS news release and Notice 2025-67). */
export const LIMITS_2026 = Object.freeze({
  electiveDeferral: 24_500,
  catchUp50: 8_000,
  catchUp60To63: 11_250,
  annualAdditions: 72_000
});

function check(name, value, { min = 0, max = Infinity, integer = false } = {}) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < min) throw new RangeError(`${name} must be at least ${min}`);
  if (value > max) throw new RangeError(`${name} must be at most ${max}`);
  if (integer && !Number.isInteger(value)) throw new RangeError(`${name} must be a whole number`);
}

/** The catch-up allowed in a year in which the employee reaches `age`. */
export function catchUpLimit(age) {
  if (age >= 60 && age <= 63) return LIMITS_2026.catchUp60To63;
  if (age >= 50) return LIMITS_2026.catchUp50;
  return 0;
}

/** The total employee deferral limit in a year in which the employee reaches `age`. */
export function deferralLimit(age) {
  return LIMITS_2026.electiveDeferral + catchUpLimit(age);
}

/** Employer match as a fraction of pay for a deferral of `deferralPercent`% of pay. */
export function matchPercentOfPay(deferralPercent, { match1Rate = 0, match1UpTo = 0, match2Rate = 0, match2UpTo = 0 }) {
  const first = Math.min(deferralPercent, match1UpTo);
  const second = Math.min(Math.max(deferralPercent - match1UpTo, 0), match2UpTo);
  return (match1Rate * first + match2Rate * second) / 10_000;
}

/**
 * @param {object} input
 * @param {number} input.currentAge whole years
 * @param {number} input.retirementAge whole years, greater than currentAge
 * @param {number} input.salary annual pay before deductions
 * @param {number} input.contributionPercent employee deferral, percent of pay
 * @param {number} [input.currentBalance]
 * @param {number} [input.annualReturn] percent a year
 * @param {number} [input.salaryGrowth] percent a year
 * @param {number} [input.match1Rate] percent of the deferral matched on the first tier
 * @param {number} [input.match1UpTo] first tier, percent of pay
 * @param {number} [input.match2Rate] percent of the deferral matched on the second tier
 * @param {number} [input.match2UpTo] second tier, percent of pay after the first
 * @param {number} [input.inflation] percent a year, for today's-dollars value
 */
export function project401k({
  currentAge, retirementAge, salary, contributionPercent, currentBalance = 0, annualReturn = 0, salaryGrowth = 0,
  match1Rate = 0, match1UpTo = 0, match2Rate = 0, match2UpTo = 0, inflation = 0
}) {
  check('currentAge', currentAge, { min: 14, max: 99, integer: true });
  check('retirementAge', retirementAge, { min: currentAge + 1, max: 100, integer: true });
  check('salary', salary);
  check('contributionPercent', contributionPercent, { max: 100 });
  check('currentBalance', currentBalance);
  check('annualReturn', annualReturn, { min: -50, max: 50 });
  check('salaryGrowth', salaryGrowth, { min: -50, max: 50 });
  check('match1Rate', match1Rate, { max: 1000 });
  check('match1UpTo', match1UpTo, { max: 100 });
  check('match2Rate', match2Rate, { max: 1000 });
  check('match2UpTo', match2UpTo, { max: 100 });
  check('inflation', inflation, { min: -10, max: 50 });

  const match = { match1Rate, match1UpTo, match2Rate, match2UpTo };
  const monthlyReturn = (1 + annualReturn / 100) ** (1 / 12) - 1;
  const years = retirementAge - currentAge;
  let balance = currentBalance;
  let pay = salary;
  const totals = { employee: 0, employer: 0 };
  const schedule = [];

  for (let year = 1; year <= years; year += 1) {
    if (year > 1) pay *= 1 + salaryGrowth / 100;
    const age = currentAge + year - 1;
    const limit = deferralLimit(age);
    const monthlyPay = pay / 12;
    let employee = 0;
    let employer = 0;
    let limitMonth = null;
    for (let month = 1; month <= 12; month += 1) {
      balance *= 1 + monthlyReturn;
      const deferral = Math.min(monthlyPay * contributionPercent / 100, limit - employee);
      const deferralPercent = monthlyPay > 0 ? deferral / monthlyPay * 100 : 0;
      employee += deferral;
      if (limitMonth === null && deferral > 0 && employee >= limit - 1e-9) limitMonth = month;
      // Section 415(c): deferrals up to the base limit plus employer money.
      const additions = Math.min(employee, LIMITS_2026.electiveDeferral) + employer;
      const employerMonth = Math.min(monthlyPay * matchPercentOfPay(deferralPercent, match), Math.max(0, LIMITS_2026.annualAdditions - additions));
      employer += employerMonth;
      balance += deferral + employerMonth;
    }
    totals.employee += employee;
    totals.employer += employer;
    schedule.push({ year, age, salary: pay, employee, employer, balance, limit, limitMonth });
  }

  const contributed = currentBalance + totals.employee + totals.employer;
  const first = schedule[0];
  // The most the match formula pays, as a percent of pay, and the deferral that earns it.
  const fullMatchPercent = matchPercentOfPay(match1UpTo + match2UpTo, match) * 100;
  const deferralForFullMatch = match2Rate > 0 ? match1UpTo + match2UpTo : match1Rate > 0 ? match1UpTo : 0;
  return {
    schedule,
    years,
    balance,
    employeeTotal: totals.employee,
    employerTotal: totals.employer,
    growth: balance - contributed,
    // The balance in today's dollars at the inflation rate entered.
    realBalance: balance / (1 + inflation / 100) ** years,
    firstYearEmployee: first.employee,
    firstYearEmployer: first.employer,
    fullMatchPercent,
    deferralForFullMatch,
    // Employer money the first year's formula would pay at the full-match deferral, less what it pays at yours.
    firstYearMatchMissed: Math.max(0, salary * fullMatchPercent / 100 - first.employer),
    limitYears: schedule.filter((row) => row.limitMonth !== null).length
  };
}

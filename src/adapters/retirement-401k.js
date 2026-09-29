/**
 * Adapter between the 401(k) Calculator page and its engine. Parses raw form
 * values, calls project401k() and shapes the result for display. No formulas
 * live here.
 */

import { project401k } from '../calculators/retirement-401k.js';
import { numberField } from '../lib/validation.js';

export const RETIREMENT_401K_LIMITS = Object.freeze({ maxSalary: 10_000_000, maxBalance: 100_000_000 });

/** Illustrative example values, not a forecast or a recommendation. */
export const RETIREMENT_401K_DEFAULTS = Object.freeze({
  currentAge: '30',
  retirementAge: '67',
  salary: '70000',
  contributionPercent: '8',
  currentBalance: '25000',
  annualReturn: '6',
  salaryGrowth: '3',
  match1Rate: '100',
  match1UpTo: '3',
  match2Rate: '50',
  match2UpTo: '2',
  inflation: '2.5'
});

export function parse401kForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const optional = (field, label, min, max) => take(field, numberField(values[field], { label, required: false, fallback: 0, min, max }));
  const currentAge = take('currentAge', numberField(values.currentAge, { label: 'Current age', min: 18, max: 80, integer: true }));
  const retirementAge = take('retirementAge', numberField(values.retirementAge, { label: 'Retirement age', min: 19, max: 90, integer: true }));
  if (!errors.currentAge && !errors.retirementAge && retirementAge <= currentAge) {
    errors.retirementAge = 'Retirement age must be greater than your current age.';
  }
  const salary = take('salary', numberField(values.salary, { label: 'Annual salary', min: 0, minExclusive: true, max: RETIREMENT_401K_LIMITS.maxSalary }));
  const contributionPercent = take('contributionPercent', numberField(values.contributionPercent, { label: 'Your contribution', min: 0, max: 100 }));
  const currentBalance = optional('currentBalance', 'Current 401(k) balance', 0, RETIREMENT_401K_LIMITS.maxBalance);
  const annualReturn = optional('annualReturn', 'Annual return', -20, 20);
  const salaryGrowth = optional('salaryGrowth', 'Salary increase', -20, 20);
  const match1Rate = optional('match1Rate', 'Employer match', 0, 500);
  const match1UpTo = optional('match1UpTo', 'Matched up to', 0, 100);
  const match2Rate = optional('match2Rate', 'Second match', 0, 500);
  const match2UpTo = optional('match2UpTo', 'On the next', 0, 100);
  const inflation = optional('inflation', 'Inflation', 0, 20);
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: { currentAge, retirementAge, salary, contributionPercent, currentBalance, annualReturn, salaryGrowth, match1Rate, match1UpTo, match2Rate, match2UpTo, inflation }
  };
}

export function build401kView(input) {
  return { input, ...project401k(input) };
}

/** Parse, validate and calculate. */
export function run401kCalculator(values) {
  const parsed = parse401kForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: build401kView(parsed.input) };
}

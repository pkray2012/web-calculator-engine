/**
 * Adapter between the Savings Goal Calculator page and its engine. Parses raw
 * form values, calls the savings-goal engine and shapes the result for
 * display. No financial formulas live here.
 */

import { calculateMonthlyNeeded, calculateTimeToGoal, savingsSchedule, emergencyFundTarget } from '../calculators/savings-goal.js';
import { numberField, termField } from '../lib/validation.js';

export const SAVINGS_LIMITS = Object.freeze({ maxMoney: 50_000_000, maxApy: 20, maxMonths: 600, maxCoverage: 24 });

/** Timeframes, in months, for the "monthly amount by deadline" comparison. */
export const SAVINGS_COMPARISON_MONTHS = Object.freeze([12, 24, 36, 60]);

/** Illustrative example values; the page labels them as an example, not current rates. */
export const SAVINGS_DEFAULTS = Object.freeze({
  goalType: 'amount',
  goalAmount: '20000',
  monthlyExpenses: '3500',
  coverageMonths: '6',
  currentSavings: '2000',
  apy: '4',
  plan: 'date',
  timeValue: '3',
  timeUnit: 'years',
  monthlyDeposit: '400'
});

export function parseSavingsForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, rules = {}) => take(field, numberField(values[field], { label, min: 0, max: SAVINGS_LIMITS.maxMoney, ...rules }));
  const goalType = values.goalType === 'emergency' ? 'emergency' : 'amount';
  const plan = values.plan === 'deposit' ? 'deposit' : 'date';

  const goalAmount = goalType === 'amount' ? money('goalAmount', 'Savings goal', { minExclusive: true }) : null;
  const monthlyExpenses = goalType === 'emergency' ? money('monthlyExpenses', 'Essential monthly expenses', { minExclusive: true }) : null;
  const coverageMonths = goalType === 'emergency'
    ? take('coverageMonths', numberField(values.coverageMonths, { label: 'Months of expenses', min: 1, max: SAVINGS_LIMITS.maxCoverage, integer: true }))
    : null;
  const currentSavings = money('currentSavings', 'Saved so far', { required: false, fallback: 0 });
  const apy = take('apy', numberField(values.apy, { label: 'APY', required: false, fallback: 0, min: 0, max: SAVINGS_LIMITS.maxApy }));
  const months = plan === 'date'
    ? take('timeValue', termField(values.timeValue, values.timeUnit, { label: 'Time to save', maxMonths: SAVINGS_LIMITS.maxMonths }))
    : null;
  const monthlyDeposit = plan === 'deposit' ? money('monthlyDeposit', 'Monthly deposit', { minExclusive: true }) : null;

  if (Object.keys(errors).length) return { ok: false, errors };
  const target = goalType === 'emergency' ? emergencyFundTarget({ monthlyExpenses, coverageMonths }) : goalAmount;
  return { ok: true, input: { goalType, goalAmount, monthlyExpenses, coverageMonths, target, currentSavings, apy, plan, months, monthlyDeposit } };
}

export function buildSavingsView(input) {
  const common = { goalAmount: input.target, currentSavings: input.currentSavings, annualRate: input.apy };
  let monthlyContribution;
  let months;
  if (input.plan === 'date') {
    months = input.months;
    monthlyContribution = calculateMonthlyNeeded({ ...common, months }).monthlyContribution;
  } else {
    monthlyContribution = input.monthlyDeposit;
    const time = calculateTimeToGoal({ ...common, monthlyContribution, maxMonths: SAVINGS_LIMITS.maxMonths });
    if (!time) throw new RangeError('monthlyDeposit reaches the goal after the maximum time');
    months = time.months;
  }
  const yearly = savingsSchedule({ currentSavings: input.currentSavings, monthlyContribution, annualRate: input.apy, months });
  const last = yearly.at(-1) ?? { deposits: 0, interest: 0, balance: input.currentSavings };
  const comparison = [...new Set([...SAVINGS_COMPARISON_MONTHS, ...(input.plan === 'date' ? [input.months] : [])])]
    .sort((a, b) => a - b)
    .map((term) => ({
      months: term,
      monthlyContribution: calculateMonthlyNeeded({ ...common, months: term }).monthlyContribution,
      selected: input.plan === 'date' && term === input.months
    }));
  return {
    input,
    target: input.target,
    alreadyFunded: input.currentSavings >= input.target,
    monthlyContribution,
    months,
    deposits: last.deposits,
    interest: last.interest,
    endingBalance: last.balance,
    yearly,
    comparison
  };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runSavingsCalculator(values) {
  const parsed = parseSavingsForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildSavingsView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { monthlyDeposit: 'At this deposit the goal would take more than 50 years. Enter a larger monthly deposit.' } };
  }
}

/**
 * Adapter between the HELOC Payment Calculator page and the HELOC engine.
 * Parses raw form values, calls calculateHeloc() and shapes the result for
 * display. No financial formulas live here.
 */

import { calculateHeloc } from '../calculators/heloc.js';
import { numberField, termField } from '../lib/validation.js';

export const HELOC_LIMITS = Object.freeze({ maxBalance: 5_000_000, maxRate: 30, maxDrawMonths: 360, maxRepaymentMonths: 480 });

/** Rate rises (percentage points) shown in the "if the rate rises" table. */
export const HELOC_STRESS_POINTS = Object.freeze([1, 2, 3]);

/** Illustrative example values; the page labels them as an example, not market rates. */
export const HELOC_DEFAULTS = Object.freeze({
  balance: '50000',
  rate: '8.5',
  drawValue: '10',
  drawUnit: 'years',
  repaymentValue: '20',
  repaymentUnit: 'years',
  drawPayment: 'interestOnly'
});

export function parseHelocForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const balance = take('balance', numberField(values.balance, { label: 'Balance drawn', min: 0, minExclusive: true, max: HELOC_LIMITS.maxBalance }));
  const rate = take('rate', numberField(values.rate, { label: 'Interest rate', min: 0, max: HELOC_LIMITS.maxRate }));
  const drawMonths = take('drawValue', termField(values.drawValue, values.drawUnit, { label: 'Draw period', maxMonths: HELOC_LIMITS.maxDrawMonths }));
  const repaymentMonths = take('repaymentValue', termField(values.repaymentValue, values.repaymentUnit, { label: 'Repayment period', maxMonths: HELOC_LIMITS.maxRepaymentMonths }));
  const drawPaymentType = values.drawPayment === 'principalAndInterest' ? 'principalAndInterest' : 'interestOnly';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { balance, rate, drawMonths, repaymentMonths, drawPaymentType } };
}

/** Year-by-year totals across both phases. */
function yearlyRows(result) {
  const rows = [
    ...result.drawSchedule.map((row) => ({ ...row, phase: 'draw' })),
    ...result.repaymentSchedule.map((row, index) => ({ ...row, month: result.drawMonths + index + 1, phase: 'repayment' }))
  ];
  const years = [];
  for (const row of rows) {
    const year = Math.ceil(row.month / 12);
    const entry = years[year - 1] ??= { year, payment: 0, interest: 0, principal: 0, balance: 0, phases: new Set() };
    entry.payment += row.payment;
    entry.interest += row.interest;
    entry.principal += row.principal;
    entry.balance = row.balance;
    entry.phases.add(row.phase);
  }
  return years.map(({ phases, ...entry }) => ({ ...entry, phase: phases.size > 1 ? 'both' : [...phases][0] }));
}

export function buildHelocView(input) {
  const stressRates = HELOC_STRESS_POINTS.map((points) => Math.min(input.rate + points, HELOC_LIMITS.maxRate + 3));
  const result = calculateHeloc({
    balance: input.balance,
    annualRate: input.rate,
    drawMonths: input.drawMonths,
    repaymentMonths: input.repaymentMonths,
    drawPaymentType: input.drawPaymentType,
    rateScenarios: stressRates
  });
  const [base, ...stress] = result.scenarios;
  return {
    input,
    drawPayment: result.drawPayment,
    repaymentPayment: result.repaymentPayment,
    repaymentStartingBalance: result.repaymentStartingBalance,
    paymentShock: result.paymentShock,
    paymentShockPercent: result.paymentShockPercent,
    drawInterest: result.drawInterest,
    repaymentInterest: result.repaymentInterest,
    totalInterest: result.totalInterest,
    totalPayments: result.totalPayments,
    repaymentStartMonth: input.drawMonths + 1,
    scenarios: [{ ...base, points: 0 }, ...stress.map((scenario, index) => ({ ...scenario, points: HELOC_STRESS_POINTS[index] }))],
    yearly: yearlyRows(result)
  };
}

/** Parse, validate and calculate in one step. Engine range errors become field errors. */
export function runHelocCalculator(values) {
  const parsed = parseHelocForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildHelocView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { rate: 'These numbers are too extreme to calculate. Check the rate and periods.' } };
  }
}

/**
 * Adapter between the Mortgage Points Calculator page and its engine.
 * Parses raw form values, calls calculateMortgagePoints() and shapes the
 * result for display. No financial formulas live here.
 */

import { calculateMortgagePoints } from '../calculators/mortgage-points.js';
import { numberField, termField } from '../lib/validation.js';

export const POINTS_LIMITS = Object.freeze({ maxLoan: 10_000_000, maxRate: 30, maxPoints: 10, maxTermMonths: 480 });

/** Illustrative example values; the page labels them as an example, not a lender's pricing. */
export const POINTS_DEFAULTS = Object.freeze({
  loanAmount: '300000',
  termYears: '30',
  baseRate: '7',
  points: '1',
  pointsRate: '6.75',
  stayYears: '7'
});

/** "If you sell or refinance after…" checkpoints, in years. */
export const POINTS_HORIZON_YEARS = Object.freeze([1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 40]);

export function parsePointsForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const loanAmount = take('loanAmount', numberField(values.loanAmount, { label: 'Loan amount', min: 0, minExclusive: true, max: POINTS_LIMITS.maxLoan }));
  const termMonths = take('termYears', termField(values.termYears, 'years', { label: 'Loan term', maxMonths: POINTS_LIMITS.maxTermMonths }));
  const baseRate = take('baseRate', numberField(values.baseRate, { label: 'Rate without points', min: 0, max: POINTS_LIMITS.maxRate }));
  const points = take('points', numberField(values.points, { label: 'Points', min: 0, max: POINTS_LIMITS.maxPoints }));
  const pointsRate = take('pointsRate', numberField(values.pointsRate, { label: 'Rate with points', min: 0, max: POINTS_LIMITS.maxRate }));
  const stayMonths = String(values.stayYears ?? '').trim() === ''
    ? null
    : take('stayYears', termField(values.stayYears, 'years', { label: 'Time you expect to keep the loan', maxMonths: POINTS_LIMITS.maxTermMonths }));
  if (errors.baseRate === undefined && errors.pointsRate === undefined && pointsRate > baseRate) {
    errors.pointsRate = 'Rate with points must not be higher than the rate without points.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { loanAmount, termMonths, baseRate, points, pointsRate, stayMonths } };
}

function horizonMonths(termMonths, stayMonths) {
  const months = POINTS_HORIZON_YEARS.map((years) => years * 12).filter((month) => month <= termMonths);
  if (stayMonths && stayMonths <= termMonths) months.push(stayMonths);
  return [...new Set(months)].sort((a, b) => a - b);
}

export function buildPointsView(input) {
  const result = calculateMortgagePoints({
    loanAmount: input.loanAmount,
    termMonths: input.termMonths,
    baseRate: input.baseRate,
    pointsRate: input.pointsRate,
    points: input.points,
    plannedStayMonths: input.stayMonths
  });
  const stayMonths = input.stayMonths === null ? null : Math.min(input.stayMonths, input.termMonths);
  return {
    input,
    pointsCost: result.pointsCost,
    rateReductionPerPoint: result.rateReductionPerPoint,
    basePayment: result.basePayment,
    pointsPayment: result.pointsPayment,
    monthlySavings: result.monthlySavings,
    baseTotalInterest: result.baseTotalInterest,
    pointsTotalInterest: result.pointsTotalInterest,
    simpleBreakEvenMonths: result.simpleBreakEvenMonths,
    breakEvenMonth: result.breakEvenMonth,
    lifetimeSavings: result.lifetimeSavings,
    stay: stayMonths === null ? null : { months: stayMonths, netSavings: result.netSavingsAt(stayMonths) },
    horizon: horizonMonths(input.termMonths, stayMonths).map((month) => ({
      ...result.positionAt(month),
      isStay: month === stayMonths
    }))
  };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runPointsCalculator(values) {
  const parsed = parsePointsForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildPointsView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { pointsRate: 'These numbers are too extreme to calculate. Check the rates and term.' } };
  }
}

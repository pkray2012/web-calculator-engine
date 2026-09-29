/**
 * Adapter between the Dividend Calculator page and its engine. Parses raw
 * form values, calls projectDividends() and shapes the result for display. No
 * formulas live here.
 */

import { projectDividends, investmentForIncome } from '../calculators/dividend.js';
import { numberField } from '../lib/validation.js';

export const DIVIDEND_LIMITS = Object.freeze({ maxAmount: 100_000_000, maxYears: 60 });

/** Illustrative example values, not a forecast or a recommendation. */
export const DIVIDEND_DEFAULTS = Object.freeze({
  initialInvestment: '10000',
  monthlyContribution: '200',
  dividendYield: '3',
  dividendGrowth: '5',
  priceGrowth: '4',
  years: '20',
  frequency: '4',
  reinvest: 'on',
  taxRate: '15',
  targetIncome: ''
});

export function parseDividendForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: DIVIDEND_LIMITS.maxAmount }));
  const initialInvestment = money('initialInvestment', 'Starting investment');
  const monthlyContribution = money('monthlyContribution', 'Monthly contribution');
  if (!errors.initialInvestment && !errors.monthlyContribution && initialInvestment === 0 && monthlyContribution === 0) {
    errors.initialInvestment = 'Enter a starting investment or a monthly contribution.';
  }
  const dividendYield = take('dividendYield', numberField(values.dividendYield, { label: 'Dividend yield', min: 0, minExclusive: true, max: 25 }));
  const rate = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: -50, max: 50 }));
  const dividendGrowth = rate('dividendGrowth', 'Dividend growth');
  const priceGrowth = rate('priceGrowth', 'Share price growth');
  const years = take('years', numberField(values.years, { label: 'Years', min: 1, max: DIVIDEND_LIMITS.maxYears, integer: true }));
  const taxRate = take('taxRate', numberField(values.taxRate, { label: 'Tax rate on dividends', required: false, fallback: 0, min: 0, max: 60 }));
  const targetIncome = money('targetIncome', 'Target annual income');
  const frequency = [1, 2, 4, 12].includes(Number(values.frequency)) ? Number(values.frequency) : 4;
  const reinvest = values.reinvest === 'on';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { initialInvestment, monthlyContribution, dividendYield, dividendGrowth, priceGrowth, years, frequency, reinvest, taxRate, targetIncome } };
}

export function buildDividendView(input) {
  const { targetIncome, ...rest } = input;
  const projection = projectDividends(/** @type {any} */ (rest));
  const cashComparison = input.reinvest ? projectDividends(/** @type {any} */ ({ ...rest, reinvest: false })) : null;
  return {
    input,
    ...projection,
    // How much more the holding is worth by reinvesting than by taking cash.
    reinvestGain: cashComparison ? projection.endingValue - cashComparison.endingValue : null,
    neededForTarget: targetIncome > 0 ? investmentForIncome({ annualIncome: targetIncome, dividendYield: input.dividendYield }) : null
  };
}

/** Parse, validate and calculate. */
export function runDividendCalculator(values) {
  const parsed = parseDividendForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildDividendView(parsed.input) };
}

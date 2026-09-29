/**
 * Adapter between the Rent vs. Buy Calculator page and its engine. Parses raw
 * form values, calls calculateRentVsBuy() and shapes the result for display.
 * No financial formulas live here.
 */

import { calculateRentVsBuy } from '../calculators/rent-vs-buy.js';
import { numberField } from '../lib/validation.js';

export const RVB_LIMITS = Object.freeze({ maxMoney: 50_000_000, maxRate: 25, maxYears: 30, maxTermYears: 40, maxPercent: 20 });

/** Illustrative example values; the page labels them as an example, not market data or forecasts. */
export const RVB_DEFAULTS = Object.freeze({
  homePrice: '400000',
  downPaymentPercent: '10',
  annualRate: '6.5',
  termYears: '30',
  monthlyRent: '2200',
  years: '10',
  appreciationPercent: '3',
  rentIncreasePercent: '3',
  investmentReturnPercent: '5',
  buyClosingCostPercent: '3',
  sellingCostPercent: '6',
  propertyTaxPercent: '1.1',
  insuranceYearly: '1800',
  maintenancePercent: '1',
  hoaMonthly: '',
  pmiRate: '0.5',
  rentersInsuranceMonthly: '15'
});

export function parseRentVsBuyForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, rules = {}) => take(field, numberField(values[field], { label, min: 0, max: RVB_LIMITS.maxMoney, ...rules }));
  const percent = (field, label, rules = {}) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: RVB_LIMITS.maxPercent, ...rules }));
  // Growth rates may be negative (falling prices or returns), but not −100% or below.
  const growth = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: -50, max: RVB_LIMITS.maxPercent }));

  const homePrice = money('homePrice', 'Home price', { minExclusive: true });
  const downPaymentPercent = take('downPaymentPercent', numberField(values.downPaymentPercent, { label: 'Down payment', required: false, fallback: 0, min: 0, max: 99 }));
  const annualRate = take('annualRate', numberField(values.annualRate, { label: 'Mortgage rate', min: 0, max: RVB_LIMITS.maxRate }));
  const termYears = take('termYears', numberField(values.termYears, { label: 'Loan term', min: 0, minExclusive: true, max: RVB_LIMITS.maxTermYears, integer: true }));
  const monthlyRent = money('monthlyRent', 'Monthly rent', { minExclusive: true });
  const years = take('years', numberField(values.years, { label: 'Years to compare', min: 1, max: RVB_LIMITS.maxYears, integer: true }));
  const appreciationPercent = growth('appreciationPercent', 'Home price growth');
  const rentIncreasePercent = percent('rentIncreasePercent', 'Rent increase');
  const investmentReturnPercent = growth('investmentReturnPercent', 'Investment return');
  const buyClosingCostPercent = percent('buyClosingCostPercent', 'Closing costs');
  const sellingCostPercent = percent('sellingCostPercent', 'Selling costs');
  const propertyTaxPercent = percent('propertyTaxPercent', 'Property tax rate');
  const insuranceYearly = money('insuranceYearly', 'Homeowners insurance', { required: false, fallback: 0 });
  const maintenancePercent = percent('maintenancePercent', 'Maintenance');
  const hoaMonthly = money('hoaMonthly', 'HOA dues', { required: false, fallback: 0 });
  const pmiRate = percent('pmiRate', 'PMI rate', { max: 5 });
  const rentersInsuranceMonthly = money('rentersInsuranceMonthly', 'Renters insurance', { required: false, fallback: 0 });

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: {
      homePrice, downPaymentPercent, annualRate, termYears, monthlyRent, years, appreciationPercent, rentIncreasePercent,
      investmentReturnPercent, buyClosingCostPercent, sellingCostPercent, propertyTaxPercent, insuranceYearly,
      maintenancePercent, hoaMonthly, pmiRate, rentersInsuranceMonthly
    }
  };
}

export function buildRentVsBuyView(input) {
  const { downPaymentPercent, termYears, ...rest } = input;
  const result = calculateRentVsBuy({
    ...rest,
    downPayment: input.homePrice * downPaymentPercent / 100,
    termMonths: termYears * 12
  });
  const last = result.rows.at(-1);
  return { input, ...result, last, buyingWins: result.advantage >= 0 };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runRentVsBuyCalculator(values) {
  const parsed = parseRentVsBuyForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildRentVsBuyView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { annualRate: 'These numbers are too extreme to calculate. Check the rate and term.' } };
  }
}

/**
 * Adapter between the Self-Employment Tax Calculator page and its engine.
 * Parses raw form values, calls the engine and shapes the result for display.
 * No formulas live here.
 */

import { calculateSelfEmploymentTax, TAX_YEARS } from '../calculators/self-employment-tax.js';
import { numberField } from '../lib/validation.js';

/** The three Additional Medicare threshold groups the form offers. */
export const FILING_STATUSES = Object.freeze(['single', 'marriedJointly', 'marriedSeparately']);

/** Illustrative example: $80,000 of net profit and no W-2 job in 2026. */
export const SE_TAX_DEFAULTS = Object.freeze({
  taxYear: '2026',
  netProfit: '80000',
  w2Wages: '0',
  filingStatus: 'single'
});

const MAX_AMOUNT = 100_000_000;

export function parseSelfEmploymentTaxForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const taxYear = TAX_YEARS.includes(Number(values.taxYear)) ? Number(values.taxYear) : TAX_YEARS.at(-1);
  const filingStatus = FILING_STATUSES.includes(values.filingStatus) ? values.filingStatus : 'single';
  const netProfit = take('netProfit', numberField(values.netProfit, { label: 'Net profit', min: -MAX_AMOUNT, max: MAX_AMOUNT }));
  const w2Wages = take('w2Wages', numberField(values.w2Wages, { label: 'W-2 wages', required: false, fallback: 0, min: 0, max: MAX_AMOUNT }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { taxYear, filingStatus, netProfit, w2Wages } };
}

export function buildSelfEmploymentTaxView(input) {
  const result = calculateSelfEmploymentTax({
    taxYear: input.taxYear,
    netProfit: input.netProfit,
    socialSecurityWages: input.w2Wages,
    medicareWages: input.w2Wages,
    filingStatus: input.filingStatus
  });
  return { input, result };
}

/** Parse, validate and calculate. */
export function runSelfEmploymentTaxCalculator(values) {
  const parsed = parseSelfEmploymentTaxForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildSelfEmploymentTaxView(parsed.input) };
}

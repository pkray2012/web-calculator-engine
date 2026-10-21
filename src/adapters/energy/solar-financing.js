/**
 * Adapter between the Solar Financing Calculator page and its engine. Parses
 * the form, calls calculateSolarFinancing() and shapes the result for
 * display. No formulas live here.
 */

import { calculateSolarFinancing, FinancingError, FINANCING_LIMITS } from '../../calculators/energy/solar-financing.js';
import { moneyField } from '../../lib/energy/money.js';
import { numberField, termField } from '../../lib/validation.js';

/** Illustrative example values, not a typical price or rate. */
export const FINANCING_DEFAULTS = Object.freeze({
  price: '20000',
  down: '',
  purchaseRebates: '',
  laterRebates: '',
  rate: '7',
  term: '120',
  termUnit: 'months',
  fees: ''
});

export function parseFinancingForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const optional = (field, label, max) => take(field, moneyField(values[field], { label, required: false, fallback: 0, min: 0, max }));
  const priceCents = take('price', moneyField(values.price, { label: 'System price', min: 0.01, max: FINANCING_LIMITS.maxPriceCents / 100 }));
  const downCents = optional('down', 'Down payment');
  const purchaseRebatesCents = optional('purchaseRebates', 'Rebates applied at purchase');
  const laterRebatesCents = optional('laterRebates', 'Rebates received later');
  const feesCents = optional('fees', 'Fees added to the loan', FINANCING_LIMITS.maxFeesCents / 100);
  const annualRate = take('rate', numberField(values.rate, { label: 'Loan interest rate', min: 0, max: FINANCING_LIMITS.maxRate }));
  const termMonths = take('term', termField(values.term, values.termUnit, { label: 'Loan term', maxMonths: FINANCING_LIMITS.maxTermMonths }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { priceCents, downCents, purchaseRebatesCents, laterRebatesCents, feesCents, annualRate, termMonths } };
}

export function buildFinancingView(input) {
  return { input, result: calculateSolarFinancing(input) };
}

/** Parse, validate and calculate. Cross-field and domain limits from the engine become field errors. */
export function runFinancingCalculator(values) {
  const parsed = parseFinancingForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildFinancingView(parsed.input) };
  } catch (error) {
    if (error instanceof FinancingError) return { ok: false, errors: { [error.field]: error.message } };
    throw error;
  }
}

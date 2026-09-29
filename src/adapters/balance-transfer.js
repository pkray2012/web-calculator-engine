/**
 * Adapter between the Balance Transfer Calculator page and its engine.
 * Parses raw form values, calls calculateBalanceTransfer() and shapes the
 * result for display. No financial formulas live here.
 */

import { calculateBalanceTransfer } from '../calculators/balance-transfer.js';
import { numberField } from '../lib/validation.js';

export const TRANSFER_LIMITS = Object.freeze({ maxBalance: 1_000_000, maxApr: 40, maxFee: 10, maxIntroMonths: 60 });

/** Illustrative example values; the page labels them as an example, not market offers. */
export const TRANSFER_DEFAULTS = Object.freeze({
  balance: '6000',
  currentApr: '24.99',
  monthlyPayment: '300',
  transferFee: '3',
  introApr: '0',
  introMonths: '18',
  postIntroApr: '21.99'
});

export function parseTransferForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const input = {
    balance: take('balance', numberField(values.balance, { label: 'Balance to transfer', min: 0, minExclusive: true, max: TRANSFER_LIMITS.maxBalance })),
    currentApr: take('currentApr', numberField(values.currentApr, { label: 'Current card APR', min: 0, max: TRANSFER_LIMITS.maxApr })),
    monthlyPayment: take('monthlyPayment', numberField(values.monthlyPayment, { label: 'Monthly payment', min: 0, minExclusive: true, max: TRANSFER_LIMITS.maxBalance })),
    transferFeePercent: take('transferFee', numberField(values.transferFee, { label: 'Balance transfer fee', required: false, fallback: 0, min: 0, max: TRANSFER_LIMITS.maxFee })),
    introApr: take('introApr', numberField(values.introApr, { label: 'Intro APR', required: false, fallback: 0, min: 0, max: TRANSFER_LIMITS.maxApr })),
    introMonths: take('introMonths', numberField(values.introMonths, { label: 'Intro period', min: 0, max: TRANSFER_LIMITS.maxIntroMonths, integer: true })),
    postIntroApr: take('postIntroApr', numberField(values.postIntroApr, { label: 'APR after the intro period', min: 0, max: TRANSFER_LIMITS.maxApr }))
  };
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input };
}

export function buildTransferView(input) {
  const result = calculateBalanceTransfer(input);
  return { input, ...result };
}

/** Parse, validate and calculate. Engine range errors become a monthly-payment error. */
export function runTransferCalculator(values) {
  const parsed = parseTransferForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildTransferView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    const message = /promotion ends/.test(error.message)
      ? 'This payment does not cover the interest once the intro period ends. Enter a higher monthly payment.'
      : 'This payment does not cover the monthly interest, so the balance would never be paid off. Enter a higher monthly payment.';
    return { ok: false, errors: { monthlyPayment: message } };
  }
}

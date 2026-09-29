/**
 * Adapter between the Car Lease Calculator page and its engine. Parses raw
 * form values, calls calculateCarLease() and shapes the result for display.
 * No financial formulas live here.
 */

import { calculateCarLease } from '../calculators/car-lease.js';
import { numberField } from '../lib/validation.js';

export const LEASE_LIMITS = Object.freeze({ maxMoney: 5_000_000, maxRate: 30, maxLeaseMonths: 60, maxLoanMonths: 96 });

/** Illustrative example values; the page labels them as an example, not a quote. */
export const LEASE_DEFAULTS = Object.freeze({
  msrp: '40000',
  price: '38000',
  residualPercent: '58',
  leaseApr: '6',
  leaseMonths: '36',
  downPayment: '3000',
  tradeInValue: '',
  tradeInPayoff: '',
  capitalizedFees: '995',
  upfrontFees: '',
  paymentTaxPercent: '7',
  loanApr: '6.5',
  loanMonths: '60',
  purchaseTaxPercent: '7'
});

export function parseLeaseForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, rules = {}) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: LEASE_LIMITS.maxMoney, ...rules }));
  const rate = (field, label, rules = {}) => take(field, numberField(values[field], { label, min: 0, max: LEASE_LIMITS.maxRate, ...rules }));
  const months = (field, label, max) => take(field, numberField(values[field], { label, min: 1, max, integer: true }));

  const input = {
    msrp: money('msrp', 'MSRP', { required: true, minExclusive: true }),
    price: money('price', 'Negotiated price', { required: true, minExclusive: true }),
    residualPercent: take('residualPercent', numberField(values.residualPercent, { label: 'Residual value', min: 1, max: 95 })),
    leaseApr: rate('leaseApr', 'Lease rate'),
    leaseMonths: months('leaseMonths', 'Lease term', LEASE_LIMITS.maxLeaseMonths),
    downPayment: money('downPayment', 'Down payment'),
    tradeInValue: money('tradeInValue', 'Trade-in value'),
    tradeInPayoff: money('tradeInPayoff', 'Amount owed on trade-in'),
    capitalizedFees: money('capitalizedFees', 'Fees added to the lease'),
    upfrontFees: money('upfrontFees', 'Fees paid at signing'),
    paymentTaxPercent: rate('paymentTaxPercent', 'Tax on lease payments', { required: false, fallback: 0 }),
    loanApr: rate('loanApr', 'Loan APR'),
    loanMonths: months('loanMonths', 'Loan term', LEASE_LIMITS.maxLoanMonths),
    purchaseTaxPercent: rate('purchaseTaxPercent', 'Sales tax if buying', { required: false, fallback: 0 })
  };
  if (!errors.leaseMonths && !errors.loanMonths && input.loanMonths < input.leaseMonths) {
    errors.loanMonths = 'Loan term must be at least as long as the lease, so the comparison covers the same time.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input };
}

export function buildLeaseView(input) {
  const result = calculateCarLease(input);
  return { input, ...result, leaseCheaper: result.leaseMinusBuy < 0 };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runLeaseCalculator(values) {
  const parsed = parseLeaseForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildLeaseView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    if (/residual/.test(error.message)) {
      return { ok: false, errors: { downPayment: 'Your down payment and trade-in bring the amount leased below the residual value. Lower them or check the residual.' } };
    }
    return { ok: false, errors: { loanApr: 'These numbers are too extreme to calculate. Check the rates and terms.' } };
  }
}

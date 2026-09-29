/**
 * Adapter between the Credit Card Payoff Calculator page and the credit-card
 * payoff engine. Parses raw form values, calls calculateCreditCardPayoff(),
 * and maps the result onto the shared amortized-loan view. No financial
 * formulas live here.
 */

import { calculateCreditCardPayoff } from '../calculators/credit-card-payoff.js';
import { numberField, monthField } from '../lib/validation.js';
import { amortizedView } from './amortized-view.js';

export const CARD_LIMITS = Object.freeze({
  maxBalance: 1_000_000,
  maxRate: 100,
  maxTargetMonths: 360
});

/** Illustrative example values; the page labels them as an example, not market data. */
export const CARD_DEFAULTS = Object.freeze({
  balance: '6000',
  apr: '24',
  mode: 'payment',
  monthlyPayment: '250',
  targetMonths: '24',
  extraMonthly: '0',
  startMonth: ''
});

/** "Debt-free by" options shown in the comparison, in months. */
export const CARD_TARGET_TERMS = Object.freeze([12, 24, 36, 48, 60]);

export function parseCardForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const mode = values.mode === 'target' ? 'target' : 'payment';

  const balance = take('balance', numberField(values.balance, {
    label: 'Card balance', min: 0, minExclusive: true, max: CARD_LIMITS.maxBalance
  }));
  const apr = take('apr', numberField(values.apr, { label: 'APR', min: 0, max: CARD_LIMITS.maxRate }));
  let monthlyPayment = null;
  let targetMonths = null;
  let extraMonthly = 0;
  if (mode === 'payment') {
    monthlyPayment = take('monthlyPayment', numberField(values.monthlyPayment, {
      label: 'Monthly payment', min: 0, minExclusive: true, max: CARD_LIMITS.maxBalance
    }));
    extraMonthly = take('extraMonthly', numberField(values.extraMonthly, {
      label: 'Extra monthly payment', required: false, fallback: 0, min: 0, max: CARD_LIMITS.maxBalance
    }));
  } else {
    targetMonths = take('targetMonths', numberField(values.targetMonths, {
      label: 'Months to pay off', min: 0, minExclusive: true, max: CARD_LIMITS.maxTargetMonths, integer: true
    }));
  }
  const startMonth = take('startMonth', monthField(values.startMonth, { label: 'First payment month' }));

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { balance, apr, mode, monthlyPayment, targetMonths, extraMonthly, startMonth } };
}

function planFrom(result) {
  return {
    monthlyPayment: result.monthlyPayment,
    totalInterest: result.totalInterest,
    totalRepayment: result.totalPaid,
    scheduledPayments: result.payoffMonths,
    schedule: result.schedule
  };
}

export function buildCardView(input) {
  const { balance, apr, mode, monthlyPayment, targetMonths, extraMonthly, startMonth } = input;
  const base = mode === 'payment'
    ? calculateCreditCardPayoff({ balance, apr, monthlyPayment })
    : calculateCreditCardPayoff({ balance, apr, targetMonths });
  const faster = extraMonthly > 0
    ? calculateCreditCardPayoff({ balance, apr, monthlyPayment: base.monthlyPayment + extraMonthly })
    : base;

  const loan = {
    ...planFrom(base),
    accelerated: {
      ...planFrom(faster),
      payments: faster.payoffMonths,
      interestSaved: base.totalInterest - faster.totalInterest,
      paymentsSaved: base.payoffMonths - faster.payoffMonths
    }
  };

  const yours = { termMonths: base.payoffMonths, monthlyPayment: base.monthlyPayment, totalInterest: base.totalInterest, selected: true };
  const termComparison = [
    ...CARD_TARGET_TERMS
      .filter((term) => term !== base.payoffMonths)
      .map((term) => {
        const result = calculateCreditCardPayoff({ balance, apr, targetMonths: term });
        return { termMonths: term, monthlyPayment: result.monthlyPayment, totalInterest: result.totalInterest, selected: false };
      }),
    yours
  ].sort((a, b) => a.termMonths - b.termMonths);

  const view = amortizedView({
    loan,
    input: { principal: balance, annualRate: apr, termMonths: base.payoffMonths, extraMonthly, startMonth },
    termComparison
  });

  return {
    ...view,
    card: {
      mode,
      targetMonths,
      firstMonthInterest: base.schedule[0].interest
    }
  };
}

/**
 * Parse, validate and calculate in one step. Engine range errors become
 * field errors instead of exceptions.
 */
export function runCardCalculator(values) {
  const parsed = parseCardForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildCardView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    if (/first-period interest/.test(error.message)) {
      return { ok: false, errors: { monthlyPayment: 'This payment does not cover the monthly interest, so the balance would never go down. Enter a larger payment.' } };
    }
    if (/too small to reach payoff/.test(error.message)) {
      return { ok: false, errors: { monthlyPayment: 'At this payment the card would take more than 100 years to pay off. Enter a larger payment.' } };
    }
    return { ok: false, errors: { apr: 'These numbers are too extreme to calculate. Check the balance and APR.' } };
  }
}

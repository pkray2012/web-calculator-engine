import { monthlyPayment as monthlyPaymentForTerm } from './loan-payment.js';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(name + ' must be a finite number');
}
function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(name + ' cannot be negative');
}
function positive(name, value) {
  finite(name, value);
  if (value <= 0) throw new RangeError(name + ' must be greater than zero');
}
function positiveInteger(name, value) {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError(name + ' must be a positive whole number');
}
function monthlyRate(apr) { return apr / 100 / 12; }
function buildSchedule({ balance, apr, monthlyPayment, maxMonths = 1200 }) {
  const rate = monthlyRate(apr), schedule = [];
  let remaining = balance, totalInterest = 0;
  for (let month = 1; month <= maxMonths && remaining > 1e-8; month += 1) {
    const interest = remaining * rate;
    const payment = Math.min(monthlyPayment, remaining + interest);
    const principal = payment - interest;
    if (principal <= 0) throw new RangeError('monthlyPayment must exceed the first-period interest');
    remaining = Math.max(0, remaining - principal);
    totalInterest += interest;
    schedule.push({ month, payment, interest, principal, balance: remaining });
  }
  if (remaining > 1e-8) throw new RangeError('monthlyPayment is too small to reach payoff');
  return { schedule, totalInterest, totalPaid: balance + totalInterest };
}
/**
 * Pass exactly one of monthlyPayment (fixed-payment mode) or targetMonths (payoff-by mode).
 * @param {{ balance: number, apr: number, monthlyPayment?: number, targetMonths?: number }} params
 */
export function calculateCreditCardPayoff({ balance, apr, monthlyPayment, targetMonths }) {
  nonNegative('balance', balance); nonNegative('apr', apr);
  const hasPayment = monthlyPayment !== undefined;
  const hasTarget = targetMonths !== undefined;
  if (hasPayment && hasTarget) throw new RangeError('choose monthlyPayment or targetMonths, not both');
  if (hasPayment) positive('monthlyPayment', monthlyPayment);
  if (hasTarget) positiveInteger('targetMonths', targetMonths);
  if (balance === 0) return { balance, apr, monthlyPayment: 0, targetMonths: targetMonths ?? 0, payoffMonths: 0, totalInterest: 0, totalPaid: 0, schedule: [] };
  if (!hasPayment && !hasTarget) throw new RangeError('monthlyPayment or targetMonths is required');
  const resolvedPayment = hasPayment ? monthlyPayment : monthlyPaymentForTerm({ principal: balance, annualRate: apr, termMonths: targetMonths });
  const result = buildSchedule({ balance, apr, monthlyPayment: resolvedPayment });
  return { balance, apr, monthlyPayment: resolvedPayment, targetMonths: hasTarget ? targetMonths : null, payoffMonths: result.schedule.length, totalInterest: result.totalInterest, totalPaid: result.totalPaid, schedule: result.schedule };
}

/**
 * Solar loan: monthly payment, interest and total cost.
 *
 * - Amount financed = price − rebates applied at purchase − down payment
 *   + fees added to the loan, all in whole cents. Rebates received later do
 *   not reduce the loan; they only lower the net cost.
 * - Payment and schedule come from the existing loan engine
 *   (src/calculators/loan-payment.js, used read-only). Interest is the sum of
 *   the monthly interest, so 0% gives exactly 0.
 * - Domain (where that engine is accurate): rate 0–25%, term 1–360 months,
 *   amount financed $100 to $100,000,000, payment at least $1.00.
 * - After every schedule, five invariants must hold to under half a cent, or
 *   the inputs are rejected instead of showing a wrong result:
 *     1 payments made = term; 2 final balance ≈ 0; 3 principal repaid ≈ amount
 *     financed; 4 total paid ≈ amount financed + interest;
 *     5 interest ≈ term × payment − amount financed.
 *   Invariants 1 and 5 are the ones that catch a schedule that ends early.
 */

import { calculateLoan } from '../loan-payment.js';
import { roundHalfUp } from '../../lib/energy/format.js';

export const FINANCING_LIMITS = Object.freeze({
  maxPriceCents: 10_000_000_000, // $100,000,000
  maxFeesCents: 10_000_000_000,
  maxLoanCents: 10_000_000_000,
  minLoanCents: 10_000, // $100
  minPaymentCents: 100, // $1.00
  maxRate: 25,
  maxTermMonths: 360
});

const TOLERANCE = 0.005; // dollars: a residual that would display as $0.01 is not "paid off"

/** A rejected input, with the form field it belongs to. */
export class FinancingError extends RangeError {
  /** @param {string} field @param {string} message */
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

/** Payment in whole cents, rounded half up on its shortest decimal form. */
const paymentCents = (payment) => Number(roundHalfUp(payment, 0, { grouping: false, shift: 2 }));

/**
 * Invariants 1–5 for a schedule. Returns the failed ones (empty when the schedule is sound).
 * @param {{ loan: number, payment: number, termMonths: number, schedule: { payment: number, principal: number, interest: number, balance: number }[] }} input
 */
export function scheduleInvariantFailures({ loan, payment, termMonths, schedule }) {
  let totalPaid = 0;
  let principal = 0;
  let interest = 0;
  for (const row of schedule) {
    totalPaid += row.payment;
    principal += row.principal;
    interest += row.interest;
  }
  const fails = [];
  if (schedule.length !== termMonths) fails.push('1 rows = n');
  if (!(schedule.at(-1)?.balance < TOLERANCE)) fails.push('2 balance');
  if (!(Math.abs(principal - loan) < TOLERANCE)) fails.push('3 principal');
  if (!(Math.abs(totalPaid - loan - interest) < TOLERANCE)) fails.push('4 totals');
  if (!(Math.abs(interest - (payment * termMonths - loan)) < TOLERANCE)) fails.push('5 interest');
  return fails;
}

/**
 * @param {object} input
 * @param {number} input.priceCents system price
 * @param {number} [input.downCents] down payment
 * @param {number} [input.purchaseRebatesCents] rebates applied at purchase
 * @param {number} [input.laterRebatesCents] rebates or incentives received later
 * @param {number} [input.feesCents] fees added to the loan
 * @param {number} input.annualRate loan interest rate, percent
 * @param {number} input.termMonths
 */
export function calculateSolarFinancing({ priceCents, downCents = 0, purchaseRebatesCents = 0, laterRebatesCents = 0, feesCents = 0, annualRate, termMonths }) {
  const L = FINANCING_LIMITS;
  const cents = (field, value, max = Number.MAX_SAFE_INTEGER) => {
    if (!Number.isSafeInteger(value) || value < 0 || value > max) throw new FinancingError(field, `${field} must be whole cents from 0 to ${max}`);
  };
  cents('price', priceCents, L.maxPriceCents);
  if (priceCents < 1) throw new FinancingError('price', 'price must be at least 1 cent');
  cents('down', downCents);
  cents('purchaseRebates', purchaseRebatesCents);
  cents('laterRebates', laterRebatesCents);
  cents('fees', feesCents, L.maxFeesCents);
  if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > L.maxRate) throw new FinancingError('rate', `rate must be 0 to ${L.maxRate}`);
  if (!Number.isInteger(termMonths) || termMonths < 1 || termMonths > L.maxTermMonths) throw new FinancingError('term', `term must be 1 to ${L.maxTermMonths} months`);
  if (downCents + purchaseRebatesCents > priceCents) throw new FinancingError('down', 'Down payment plus rebates at purchase cannot be more than the system price.');
  if (laterRebatesCents > priceCents - purchaseRebatesCents) throw new FinancingError('laterRebates', 'Later rebates cannot be more than the price after purchase rebates.');

  const loanCents = priceCents - purchaseRebatesCents - downCents + feesCents;
  if (loanCents > L.maxLoanCents) throw new FinancingError('price', 'This loan is too large to model.');
  const netInstalledPrice = (priceCents - purchaseRebatesCents - laterRebatesCents) / 100;
  const down = downCents / 100;
  const later = laterRebatesCents / 100;

  if (loanCents === 0) {
    return { loan: 0, noLoanNeeded: true, payment: null, totalOfPayments: 0, interest: 0, payments: 0, financingOutlay: down, netInstalledPrice, netCostAfterLaterRebates: down - later };
  }
  if (loanCents < L.minLoanCents) throw new FinancingError('price', 'This loan is too small to model.');

  const loan = loanCents / 100;
  let result;
  try {
    result = calculateLoan({ principal: loan, annualRate, termMonths });
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    // A positive rate so small that the monthly rate underflows to 0 cannot be computed.
    const monthlyRate = annualRate / 100 / 12;
    throw new FinancingError('rate', annualRate > 0 && (monthlyRate === 0 || -Math.expm1(-termMonths * Math.log1p(monthlyRate)) === 0)
      ? 'This rate is too small to calculate; enter 0 for no interest.'
      : 'This rate and term are too extreme to calculate.');
  }
  const payment = result.monthlyPayment;
  if (paymentCents(payment) < L.minPaymentCents) throw new FinancingError('term', 'This loan is too small to model.');
  for (const value of [result.totalRepayment, result.totalInterest]) {
    if (!Number.isFinite(value)) throw new FinancingError('rate', 'This rate and term are too extreme to calculate.');
  }
  if (scheduleInvariantFailures({ loan, payment, termMonths, schedule: result.schedule }).length) {
    throw new FinancingError('rate', 'This rate and term are too extreme to calculate.');
  }
  return {
    loan,
    noLoanNeeded: false,
    payment,
    totalOfPayments: result.totalRepayment,
    interest: result.totalInterest,
    payments: result.scheduledPayments,
    financingOutlay: down + result.totalRepayment,
    netInstalledPrice,
    netCostAfterLaterRebates: down + result.totalRepayment - later
  };
}

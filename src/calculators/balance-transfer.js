/**
 * Balance transfer vs. keeping a credit card balance.
 *
 * Ported from PR #24 (`feat/balance-transfer-engine`) onto current main with
 * two corrections:
 *  - The intro APR is applied as entered. #24 passed the intro months to its
 *    simulator's zero-rate window, so a 1.99% intro rate was modelled as 0%.
 *  - The payment needed to clear the balance within the promotion is an
 *    annuity payment at the intro APR, not balance ÷ months (#24's formula,
 *    which is only right at 0%).
 *
 * The "keep" path reuses the production credit card payoff engine. The
 * transfer path adds the fee to the transferred balance, charges the intro
 * APR for the promotional months, then the post-promotion APR on anything
 * left. The same fixed monthly payment is used on both paths. Interest is
 * APR ÷ 12 on the balance each month, as on the Credit Card Payoff page.
 */

import { calculateCreditCardPayoff } from './credit-card-payoff.js';
import { monthlyPayment as annuityPayment } from './loan-payment.js';

const MAX_MONTHS = 1200;
const EPSILON = 1e-8;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}
function rate(name, value) {
  finite(name, value);
  if (value < 0 || value > 100) throw new RangeError(`${name} must be between 0 and 100`);
}

/** Month-by-month payoff with the intro APR for the first introMonths, then the post-intro APR. */
function transferSchedule({ balance, introApr, introMonths, postIntroApr, monthlyPayment }) {
  const rows = [];
  let remaining = balance;
  let totalInterest = 0;
  let balanceAtPromoEnd = introMonths === 0 ? balance : null;
  for (let month = 1; month <= MAX_MONTHS && remaining > EPSILON; month += 1) {
    const apr = month <= introMonths ? introApr : postIntroApr;
    const interest = remaining * (apr / 100 / 12);
    const payment = Math.min(monthlyPayment, remaining + interest);
    if (payment - interest <= 0) {
      throw new RangeError(month <= introMonths
        ? 'The monthly payment does not cover the interest at the intro APR'
        : 'The monthly payment does not cover the interest once the promotion ends, so the balance would never be paid off');
    }
    remaining = Math.max(0, remaining + interest - payment);
    if (remaining <= EPSILON) remaining = 0;
    totalInterest += interest;
    rows.push({ month, apr, payment, interest, principal: payment - interest, balance: remaining });
    if (month === introMonths) balanceAtPromoEnd = remaining;
  }
  if (remaining > EPSILON) throw new RangeError('The monthly payment does not pay off the balance within 100 years');
  return { rows, totalInterest, payoffMonths: rows.length, balanceAtPromoEnd: balanceAtPromoEnd ?? 0 };
}

/**
 * @param {{ balance: number, currentApr: number, monthlyPayment: number, transferFeePercent: number,
 *   introApr: number, introMonths: number, postIntroApr: number }} params
 */
export function calculateBalanceTransfer({ balance, currentApr, monthlyPayment, transferFeePercent, introApr, introMonths, postIntroApr }) {
  finite('balance', balance);
  if (balance <= 0) throw new RangeError('balance must be greater than 0');
  rate('currentApr', currentApr);
  finite('monthlyPayment', monthlyPayment);
  if (monthlyPayment <= 0) throw new RangeError('monthlyPayment must be greater than 0');
  rate('transferFeePercent', transferFeePercent);
  rate('introApr', introApr);
  if (!Number.isInteger(introMonths) || introMonths < 0 || introMonths > MAX_MONTHS) throw new RangeError('introMonths must be a whole number of months');
  rate('postIntroApr', postIntroApr);

  const keep = calculateCreditCardPayoff({ balance, apr: currentApr, monthlyPayment });
  const transferFee = balance * transferFeePercent / 100;
  const transferredBalance = balance + transferFee;
  const transfer = transferSchedule({ balance: transferredBalance, introApr, introMonths, postIntroApr, monthlyPayment });

  const keepTotal = balance + keep.totalInterest;
  const transferTotal = transferredBalance + transfer.totalInterest;
  const clearsDuringPromo = introMonths > 0 && transfer.payoffMonths <= introMonths;

  return {
    balance,
    monthlyPayment,
    transferFee,
    transferredBalance,
    introMonths,
    keep: { interest: keep.totalInterest, totalCost: keepTotal, payoffMonths: keep.payoffMonths },
    transfer: {
      interest: transfer.totalInterest,
      fee: transferFee,
      totalCost: transferTotal,
      payoffMonths: transfer.payoffMonths,
      balanceAtPromoEnd: clearsDuringPromo ? 0 : transfer.balanceAtPromoEnd,
      clearsDuringPromo,
      schedule: transfer.rows
    },
    paymentToClearDuringPromo: introMonths > 0 ? annuityPayment({ principal: transferredBalance, annualRate: introApr, termMonths: introMonths }) : null,
    // Positive when the transfer costs less in total (fee included).
    netSavings: keepTotal - transferTotal,
    monthsSaved: keep.payoffMonths - transfer.payoffMonths
  };
}

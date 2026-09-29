/**
 * Fixed-rate home equity loan: the payment on the amount borrowed, plus the
 * combined loan-to-value (CLTV) arithmetic lenders use to cap how much can be
 * borrowed against a home. Amortization comes from the shared loan engine.
 * The CLTV figures are arithmetic on the user's inputs, not a lender decision.
 */

import { calculateLoan } from './loan-payment.js';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/** Common CLTV caps shown side by side; the lender's actual cap varies. */
export const CLTV_LIMITS = Object.freeze([80, 85, 90]);

/** Most a new home-equity loan can add before total home debt reaches cltvPercent of the home's value. */
export function borrowingCapacity({ homeValue, existingDebt, cltvPercent }) {
  return Math.max(0, homeValue * cltvPercent / 100 - existingDebt);
}

export function calculateHomeEquityLoan({
  homeValue,
  mortgageBalance,
  otherLiens = 0,
  loanAmount,
  annualRate,
  termMonths,
  closingCosts = 0,
  financeClosingCosts = false,
  extraMonthly = 0
}) {
  finite('homeValue', homeValue);
  if (homeValue <= 0) throw new RangeError('homeValue must be greater than 0');
  nonNegative('mortgageBalance', mortgageBalance);
  nonNegative('otherLiens', otherLiens);
  nonNegative('closingCosts', closingCosts);

  const principal = loanAmount + (financeClosingCosts ? closingCosts : 0);
  const loan = calculateLoan({ principal, annualRate, termMonths, extraMonthly });
  const existingDebt = mortgageBalance + otherLiens;
  const cashReceived = loanAmount - (financeClosingCosts ? 0 : closingCosts);

  return {
    ...loan,
    principal,
    cashReceived,
    existingDebt,
    equity: homeValue - existingDebt,
    currentCltv: existingDebt / homeValue * 100,
    newCltv: (existingDebt + principal) / homeValue * 100,
    limits: CLTV_LIMITS.map((cltvPercent) => {
      const capacity = borrowingCapacity({ homeValue, existingDebt, cltvPercent });
      return { cltvPercent, maxTotalDebt: homeValue * cltvPercent / 100, capacity, fits: principal <= capacity + 1e-9 };
    }),
    // Everything repaid beyond the cash actually received: interest plus closing costs.
    costOfBorrowing: loan.totalRepayment - cashReceived
  };
}

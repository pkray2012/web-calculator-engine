/**
 * Certificate of deposit (CD) growth, with an optional early-withdrawal
 * scenario and tax on the interest.
 *
 * Rates: the annual percentage yield (APY) is the total interest earned over a
 * year including compounding (Regulation DD). A stated interest rate r
 * compounded n times a year has APY = (1 + r/n)^n − 1; given an APY, the
 * equivalent stated rate is r = n × ((1 + APY)^(1/n) − 1).
 *
 * Balance after m months, with interest left in the CD:
 *   balance(m) = deposit × (1 + APY)^(m / 12)
 * Each month is treated as 1/12 of a year; a bank that counts actual days can
 * differ by a few cents.
 *
 * Early withdrawal: the penalty is modeled as a number of months of simple
 * interest on the deposit at the stated rate, the most common way banks state
 * it ("3 months' interest"). It can exceed the interest earned so far, in
 * which case part of the deposit is lost.
 */

export const COMPOUNDING = Object.freeze({ daily: 365, monthly: 12, quarterly: 4, annually: 1 });

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

export const apyFromRate = (rate, periodsPerYear) => (1 + rate / periodsPerYear) ** periodsPerYear - 1;
export const rateFromApy = (apy, periodsPerYear) => periodsPerYear * ((1 + apy) ** (1 / periodsPerYear) - 1);

/**
 * @param {object} input
 * @param {number} input.deposit
 * @param {number} input.ratePercent  the APY or the stated rate, in percent
 * @param {'apy' | 'apr'} input.rateType
 * @param {keyof typeof COMPOUNDING} input.compounding
 * @param {number} input.termMonths
 * @param {number} [input.taxPercent]  tax rate on interest, in percent
 * @param {number} [input.penaltyMonths]  early-withdrawal penalty in months of interest
 * @param {number | null} [input.withdrawMonth]  months after opening when the CD is cashed in early
 */
export function calculateCd({ deposit, ratePercent, rateType, compounding, termMonths, taxPercent = 0, penaltyMonths = 0, withdrawMonth = null }) {
  nonNegative('deposit', deposit);
  if (deposit <= 0) throw new RangeError('deposit must be greater than 0');
  nonNegative('ratePercent', ratePercent);
  nonNegative('taxPercent', taxPercent);
  nonNegative('penaltyMonths', penaltyMonths);
  if (taxPercent > 100) throw new RangeError('taxPercent cannot exceed 100');
  if (rateType !== 'apy' && rateType !== 'apr') throw new RangeError('rateType must be apy or apr');
  const periods = COMPOUNDING[compounding];
  if (!periods) throw new RangeError('compounding must be daily, monthly, quarterly or annually');
  if (!Number.isInteger(termMonths) || termMonths <= 0) throw new RangeError('termMonths must be a positive whole number');
  if (withdrawMonth !== null && (!Number.isInteger(withdrawMonth) || withdrawMonth <= 0 || withdrawMonth >= termMonths)) {
    throw new RangeError('withdrawMonth must be a whole number of months before the CD matures');
  }

  const rate = ratePercent / 100;
  const apy = rateType === 'apy' ? rate : apyFromRate(rate, periods);
  const statedRate = rateType === 'apr' ? rate : rateFromApy(rate, periods);
  const balanceAt = (months) => deposit * (1 + apy) ** (months / 12);

  const maturityValue = balanceAt(termMonths);
  const interest = maturityValue - deposit;
  const tax = interest * taxPercent / 100;

  // Year-end balances, plus the maturity month when the term is not whole years.
  const schedule = [];
  let previous = deposit;
  for (let month = 12; month < termMonths + 12; month += 12) {
    const end = Math.min(month, termMonths);
    const balance = balanceAt(end);
    schedule.push({ month: end, interest: balance - previous, balance });
    previous = balance;
    if (end === termMonths) break;
  }

  // The same stated rate at every compounding frequency.
  const byCompounding = Object.entries(COMPOUNDING).map(([name, n]) => {
    const frequencyApy = apyFromRate(statedRate, n);
    const value = deposit * (1 + frequencyApy) ** (termMonths / 12);
    return { compounding: name, apy: frequencyApy, maturityValue: value, interest: value - deposit };
  });

  let earlyWithdrawal = null;
  if (withdrawMonth !== null) {
    const balance = balanceAt(withdrawMonth);
    const penalty = deposit * statedRate * penaltyMonths / 12;
    const received = balance - penalty;
    earlyWithdrawal = {
      month: withdrawMonth,
      balance,
      interestEarned: balance - deposit,
      penalty,
      received,
      gain: received - deposit,
      losesPrincipal: received < deposit
    };
  }

  return {
    apy,
    statedRate,
    maturityValue,
    interest,
    tax,
    afterTaxInterest: interest - tax,
    schedule,
    byCompounding,
    earlyWithdrawal
  };
}

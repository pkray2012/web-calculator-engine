/**
 * Compound interest with regular monthly contributions.
 *
 * A stated annual rate r compounded n times a year grows a balance by the
 * factor g = (1 + r/n)^(n/12) each month (g = e^(r/12) for continuous
 * compounding), so a balance left for a year grows by (1 + r/n)^n, its APY.
 * Contributions are added once a month, at the end of the month by default or
 * at the start:
 *   end:   balance(m+1) = balance(m) × g + deposit
 *   start: balance(m+1) = (balance(m) + deposit) × g
 * Closed form after N months: P × g^N + D × (g^N − 1)/(g − 1), times g for
 * start-of-month deposits.
 *
 * Also reported: the same deposits with simple interest (interest never earns
 * interest), the value in today's dollars at an inflation rate, and the time
 * to double a lump sum, exactly and by the rule of 72.
 */

export const COMPOUNDING = Object.freeze({ daily: 365, monthly: 12, quarterly: 4, annually: 1, continuously: Infinity });

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

export function monthlyFactor(rate, compounding) {
  const n = COMPOUNDING[compounding];
  if (n === undefined) throw new RangeError('unknown compounding frequency');
  return n === Infinity ? Math.exp(rate / 12) : (1 + rate / n) ** (n / 12);
}

/**
 * @param {object} input
 * @param {number} input.initialDeposit
 * @param {number} input.monthlyContribution
 * @param {number} input.ratePercent  stated annual rate, percent
 * @param {keyof typeof COMPOUNDING} input.compounding
 * @param {number} input.years  whole years
 * @param {'end' | 'start'} [input.contributionTiming]
 * @param {number} [input.inflationPercent]
 */
export function calculateCompoundInterest({ initialDeposit, monthlyContribution, ratePercent, compounding, years, contributionTiming = 'end', inflationPercent = 0 }) {
  nonNegative('initialDeposit', initialDeposit);
  nonNegative('monthlyContribution', monthlyContribution);
  nonNegative('ratePercent', ratePercent);
  nonNegative('inflationPercent', inflationPercent);
  if (initialDeposit === 0 && monthlyContribution === 0) throw new RangeError('enter a deposit or a monthly contribution');
  if (!Number.isInteger(years) || years <= 0) throw new RangeError('years must be a positive whole number');
  if (contributionTiming !== 'end' && contributionTiming !== 'start') throw new RangeError('contributionTiming must be end or start');

  const rate = ratePercent / 100;
  const g = monthlyFactor(rate, compounding);
  const apy = g ** 12 - 1;
  const months = years * 12;

  let balance = initialDeposit;
  let simpleBalance = initialDeposit;
  let simplePrincipal = initialDeposit;
  let contributed = initialDeposit;
  const schedule = [];
  let yearStartBalance = balance;
  let yearContributions = 0;
  for (let month = 1; month <= months; month += 1) {
    if (contributionTiming === 'start') {
      balance = (balance + monthlyContribution) * g;
      simplePrincipal += monthlyContribution;
      simpleBalance += monthlyContribution + simplePrincipal * rate / 12;
    } else {
      balance = balance * g + monthlyContribution;
      simpleBalance += simplePrincipal * rate / 12 + monthlyContribution;
      simplePrincipal += monthlyContribution;
    }
    contributed += monthlyContribution;
    yearContributions += monthlyContribution;
    if (month % 12 === 0) {
      schedule.push({
        year: month / 12,
        contributions: yearContributions,
        interest: balance - yearStartBalance - yearContributions,
        totalContributed: contributed,
        balance
      });
      yearStartBalance = balance;
      yearContributions = 0;
    }
  }

  const futureValue = balance;
  const totalInterest = futureValue - contributed;
  const inflationFactor = (1 + inflationPercent / 100) ** years;
  return {
    apy,
    monthlyFactor: g,
    futureValue,
    totalContributed: contributed,
    totalInterest,
    simpleInterestValue: simpleBalance,
    compoundingBonus: futureValue - simpleBalance,
    realValue: futureValue / inflationFactor,
    doublingYears: apy > 0 ? Math.log(2) / Math.log(1 + apy) : null,
    ruleOf72Years: ratePercent > 0 ? 72 / ratePercent : null,
    schedule
  };
}

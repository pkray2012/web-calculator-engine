/**
 * Savings-goal domain engine.
 * Solves the two user questions that sit on top of compound growth:
 * 1) how much to save each month to reach a target by a fixed month
 * 2) how many months a fixed monthly contribution needs to reach a target
 *
 * Savings-goal calculations use an annual APY and monthly deposits. APY is an
 * effective annual rate, so the monthly rate is derived as (1 + APY)^(1/12)-1.
 */

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  finite(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

function validateCommon({ goalAmount, currentSavings, annualRate }) {
  positive('goalAmount', goalAmount);
  nonNegative('currentSavings', currentSavings);
  finite('annualRate', annualRate);
  if (annualRate <= -100) throw new RangeError('annualRate must be greater than -100%');
}

function monthlyRate(annualRate) {
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
}

function futureValue(currentSavings, monthlyContribution, rate, months) {
  if (months <= 0) return currentSavings;
  if (rate === 0) return currentSavings + monthlyContribution * months;
  const factor = Math.pow(1 + rate, months);
  return currentSavings * factor + monthlyContribution * ((factor - 1) / rate);
}

export function calculateMonthlyNeeded({
  goalAmount,
  currentSavings = 0,
  annualRate = 0,
  months
}) {
  validateCommon({ goalAmount, currentSavings, annualRate });
  if (!Number.isInteger(months) || months <= 0) {
    throw new RangeError('months must be a positive whole number');
  }

  const rate = monthlyRate(annualRate);
  const grownStartingBalance = futureValue(currentSavings, 0, rate, months);
  const gap = Math.max(0, goalAmount - grownStartingBalance);

  let monthlyContribution;
  if (gap === 0) {
    monthlyContribution = 0;
  } else if (rate === 0) {
    monthlyContribution = gap / months;
  } else {
    const factor = Math.pow(1 + rate, months);
    monthlyContribution = gap * rate / (factor - 1);
  }

  const endingBalance = futureValue(currentSavings, monthlyContribution, rate, months);
  return {
    goalAmount,
    currentSavings,
    annualRate,
    months,
    monthlyContribution,
    endingBalance,
    totalContributions: currentSavings + monthlyContribution * months,
    interestEarned: endingBalance - currentSavings - monthlyContribution * months
  };
}

export function calculateTimeToGoal({
  goalAmount,
  currentSavings = 0,
  monthlyContribution,
  annualRate = 0,
  maxMonths = 1200
}) {
  validateCommon({ goalAmount, currentSavings, annualRate });
  positive('monthlyContribution', monthlyContribution);
  if (!Number.isInteger(maxMonths) || maxMonths <= 0) {
    throw new RangeError('maxMonths must be a positive whole number');
  }

  if (currentSavings >= goalAmount) {
    return {
      goalAmount,
      currentSavings,
      annualRate,
      monthlyContribution,
      months: 0,
      endingBalance: currentSavings,
      totalContributions: currentSavings,
      interestEarned: 0
    };
  }

  const rate = monthlyRate(annualRate);
  let balance = currentSavings;
  let contributions = currentSavings;
  let interest = 0;

  // A tiny tolerance keeps a contribution solved by calculateMonthlyNeeded()
  // from missing its own deadline through floating-point rounding.
  const reached = goalAmount - goalAmount * 1e-12;
  for (let month = 1; month <= maxMonths; month += 1) {
    const earned = balance * rate;
    balance += earned + monthlyContribution;
    contributions += monthlyContribution;
    interest += earned;
    if (balance >= reached) {
      return {
        goalAmount,
        currentSavings,
        annualRate,
        monthlyContribution,
        months: month,
        endingBalance: balance,
        totalContributions: contributions,
        interestEarned: interest
      };
    }
  }

  return null;
}

/**
 * Year-by-year balances for a plan: deposits at the end of each month, with
 * interest credited monthly at the rate implied by the APY. The last row is a
 * partial year when months is not a multiple of 12.
 */
export function savingsSchedule({ currentSavings = 0, monthlyContribution, annualRate = 0, months }) {
  nonNegative('currentSavings', currentSavings);
  nonNegative('monthlyContribution', monthlyContribution);
  finite('annualRate', annualRate);
  if (!Number.isInteger(months) || months < 0) throw new RangeError('months must be a whole number');
  const rate = monthlyRate(annualRate);
  const rows = [];
  let balance = currentSavings;
  let deposits = 0;
  let interest = 0;
  for (let month = 1; month <= months; month += 1) {
    const earned = balance * rate;
    balance += earned + monthlyContribution;
    deposits += monthlyContribution;
    interest += earned;
    if (month % 12 === 0 || month === months) {
      rows.push({ year: Math.ceil(month / 12), month, deposits, interest, balance });
    }
  }
  return rows;
}

/** Emergency fund target: essential monthly expenses × months of coverage. */
export function emergencyFundTarget({ monthlyExpenses, coverageMonths }) {
  positive('monthlyExpenses', monthlyExpenses);
  if (!Number.isInteger(coverageMonths) || coverageMonths <= 0) throw new RangeError('coverageMonths must be a positive whole number');
  return monthlyExpenses * coverageMonths;
}

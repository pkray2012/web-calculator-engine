/**
 * Dividend income and growth: a month-by-month projection of a dividend-paying
 * holding, with or without reinvestment (a DRIP).
 *
 * Model (all rates annual, entered as percentages):
 * - The share price starts at 1 (only ratios matter) and grows by
 *   `priceGrowth` a year, compounded monthly: price × (1 + g)^(1/12) each month.
 * - The starting dividend per share is `dividendYield` × price. It rises by
 *   `dividendGrowth` at the start of each year after the first, so the payout
 *   is fixed within a year, as most companies set it.
 * - Dividends are paid `frequency` times a year (1, 2, 4 or 12), each payout
 *   being a 1/frequency share of the annual dividend per share, on the shares
 *   held at the end of the paying month.
 * - An optional tax rate is taken from each payout. The remainder is reinvested
 *   at that month's price, or kept as cash (no interest) if not reinvesting.
 * - Monthly contributions buy shares at the start of each month.
 *
 * This is an illustration with constant rates; real dividends, prices and taxes
 * change, and dividends can be cut.
 */

export const FREQUENCIES = Object.freeze({ 1: 'Annually', 2: 'Twice a year', 4: 'Quarterly', 12: 'Monthly' });

function check(name, value, { min = 0, max = Infinity, integer = false } = {}) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < min) throw new RangeError(`${name} must be at least ${min}`);
  if (value > max) throw new RangeError(`${name} must be at most ${max}`);
  if (integer && !Number.isInteger(value)) throw new RangeError(`${name} must be a whole number`);
}

/**
 * @param {object} input
 * @param {number} input.initialInvestment dollars invested at the start
 * @param {number} input.dividendYield starting yield, percent of price
 * @param {number} input.years whole years to project
 * @param {number} [input.monthlyContribution]
 * @param {number} [input.dividendGrowth] percent a year
 * @param {number} [input.priceGrowth] percent a year
 * @param {1|2|4|12} [input.frequency] payouts a year
 * @param {boolean} [input.reinvest]
 * @param {number} [input.taxRate] percent of each dividend
 */
export function projectDividends({
  initialInvestment, dividendYield, years, monthlyContribution = 0, dividendGrowth = 0, priceGrowth = 0,
  frequency = 4, reinvest = true, taxRate = 0
}) {
  check('initialInvestment', initialInvestment);
  check('monthlyContribution', monthlyContribution);
  if (initialInvestment === 0 && monthlyContribution === 0) throw new RangeError('enter an investment or a monthly contribution');
  check('dividendYield', dividendYield, { max: 100 });
  check('years', years, { min: 1, max: 60, integer: true });
  check('dividendGrowth', dividendGrowth, { min: -50, max: 50 });
  check('priceGrowth', priceGrowth, { min: -50, max: 50 });
  check('taxRate', taxRate, { max: 100 });
  if (!Object.hasOwn(FREQUENCIES, frequency)) throw new RangeError(`frequency must be 1, 2, 4 or 12, not ${frequency}`);

  const monthlyPriceFactor = (1 + priceGrowth / 100) ** (1 / 12);
  const monthsBetweenPayouts = 12 / frequency;
  let price = 1;
  let annualDividendPerShare = dividendYield / 100;
  let shares = initialInvestment / price;
  let cash = 0;
  let contributed = initialInvestment;
  const totals = { dividends: 0, taxes: 0, reinvested: 0 };
  const schedule = [];

  for (let year = 1; year <= years; year += 1) {
    if (year > 1) annualDividendPerShare *= 1 + dividendGrowth / 100;
    const yearTotals = { dividends: 0, taxes: 0, contributions: 0 };
    for (let month = 1; month <= 12; month += 1) {
      if (monthlyContribution > 0) {
        shares += monthlyContribution / price;
        contributed += monthlyContribution;
        yearTotals.contributions += monthlyContribution;
      }
      price *= monthlyPriceFactor;
      if (month % monthsBetweenPayouts === 0) {
        const dividend = shares * annualDividendPerShare / frequency;
        const tax = dividend * taxRate / 100;
        const net = dividend - tax;
        yearTotals.dividends += dividend;
        yearTotals.taxes += tax;
        if (reinvest) {
          shares += net / price;
          totals.reinvested += net;
        } else {
          cash += net;
        }
      }
    }
    totals.dividends += yearTotals.dividends;
    totals.taxes += yearTotals.taxes;
    schedule.push({
      year,
      contributions: yearTotals.contributions,
      dividends: yearTotals.dividends,
      taxes: yearTotals.taxes,
      holdingValue: shares * price,
      cash,
      // Next year's income at the year-end holding: a year-end run rate.
      annualIncome: shares * annualDividendPerShare * (1 + dividendGrowth / 100)
    });
  }

  const holdingValue = shares * price;
  const last = schedule[schedule.length - 1];
  return {
    schedule,
    contributed,
    totalDividends: totals.dividends,
    totalTaxes: totals.taxes,
    reinvested: totals.reinvested,
    holdingValue,
    cash,
    endingValue: holdingValue + cash,
    // Dividends received in the final year, and the rate going into the next year.
    finalYearDividends: last.dividends,
    nextYearIncome: last.annualIncome,
    monthlyIncomeNextYear: last.annualIncome / 12,
    // Income as a share of the money put in.
    yieldOnCost: contributed > 0 ? last.annualIncome / contributed * 100 : 0,
    currentYield: dividendYield * (1 + dividendGrowth / 100) ** years / (1 + priceGrowth / 100) ** years
  };
}

/**
 * The investment needed today for a target annual dividend income at a yield,
 * ignoring growth and taxes: target ÷ yield.
 */
export function investmentForIncome({ annualIncome, dividendYield }) {
  check('annualIncome', annualIncome);
  check('dividendYield', dividendYield, { max: 100 });
  if (dividendYield === 0) throw new RangeError('dividendYield must be greater than 0');
  return annualIncome / (dividendYield / 100);
}

/**
 * Simple return on a solar system over a period the user chooses (B1-11).
 * The page states this as its own definition (owner decision D4): no time
 * value of money, no change in electricity prices, no panel degradation; not
 * an IRR, NPV or annualized return.
 *
 * - Net cost = cost − incentives.
 * - Net savings per year = yearly bill savings − yearly maintenance.
 * - Total net savings = net savings per year × years; net gain = total − net cost.
 * - ROI = net gain ÷ net cost × 100 %, defined only when the net cost is above 0.
 * All amounts are whole cents, so the totals and the gain are exact.
 */

import { MAX_AMOUNT_CENTS } from './solar-payback.js';

export const ROI_LIMITS = Object.freeze({
  years: { min: 1, max: 50 }
});

export const LONG_PERIOD_YEARS = 25; // the example lifetime in the DOE/NREL document (E6)

function cents(name, value, min = 0) {
  if (!Number.isSafeInteger(value) || value < min || value > MAX_AMOUNT_CENTS) throw new RangeError(`${name} must be whole cents from ${min} to ${MAX_AMOUNT_CENTS}`);
}

/**
 * @param {object} input
 * @param {number} input.costCents installed cost
 * @param {number} [input.incentivesCents] incentives received
 * @param {number} input.savingsCents yearly bill savings
 * @param {number} input.maintenanceCents yearly maintenance
 * @param {number} input.years whole years, 1 to 50
 */
export function calculateSolarRoi({ costCents, incentivesCents = 0, savingsCents, maintenanceCents, years }) {
  cents('costCents', costCents, 1);
  cents('incentivesCents', incentivesCents);
  if (incentivesCents > costCents) throw new RangeError('incentives cannot exceed the installed cost');
  cents('savingsCents', savingsCents);
  cents('maintenanceCents', maintenanceCents);
  if (!Number.isInteger(years) || years < ROI_LIMITS.years.min || years > ROI_LIMITS.years.max) throw new RangeError('years must be a whole number from 1 to 50');

  const netCostCents = costCents - incentivesCents;
  const netSavingsPerYearCents = savingsCents - maintenanceCents;
  const totalNetSavingsCents = netSavingsPerYearCents * years;
  const netGainCents = totalNetSavingsCents - netCostCents;
  const defined = netCostCents > 0;
  return {
    defined,
    netCostCents,
    netSavingsPerYearCents,
    totalNetSavingsCents,
    netGainCents,
    roiPercent: defined ? netGainCents / netCostCents * 100 : null,
    roiRatio: defined ? { n: BigInt(netGainCents) * 100n, d: BigInt(netCostCents) } : null,
    longPeriod: years > LONG_PERIOD_YEARS
  };
}

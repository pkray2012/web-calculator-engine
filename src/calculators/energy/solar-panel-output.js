/**
 * Solar energy produced by a system of a given size (B1-20, input-only
 * rescope).
 *
 * - Daily kWh = size (kW DC) × peak sun hours × (1 − losses ÷ 100).
 * - Yearly kWh = daily × 365; monthly average = yearly ÷ 12.
 * The displayed figures are rounded once each from the exact values, so a
 * monthly average of exactly 894.615 kWh shows as 894.62 kWh.
 */

import { exactRatio, multiplyRatios } from '../../lib/energy/money.js';
import { checkSunAndLosses, usableFraction, usableFractionRatio, range, finite, DAYS_PER_YEAR, HIGH_LOSSES } from './solar-sun-hours.js';

export const OUTPUT_LIMITS = Object.freeze({
  sizeKw: { min: 0.001, max: 1000 }
});

/**
 * @param {object} input
 * @param {number} input.sizeKw system size, kW DC
 * @param {number} input.sunHours peak sun hours per day
 * @param {number} input.losses system losses, percent
 */
export function calculateSolarPanelOutput({ sizeKw, sunHours, losses }) {
  range('sizeKw', sizeKw, OUTPUT_LIMITS.sizeKw);
  checkSunAndLosses(sunHours, losses);

  const dailyKwh = finite('sizeKw', sizeKw * sunHours * usableFraction(losses));
  const annualKwh = dailyKwh * DAYS_PER_YEAR;
  const daily = multiplyRatios(exactRatio([sizeKw, sunHours]), usableFractionRatio(losses));
  const annual = multiplyRatios(daily, { n: BigInt(DAYS_PER_YEAR), d: 1n });
  return {
    dailyKwh,
    annualKwh,
    monthlyKwh: annualKwh / 12,
    exact: { daily, annual, monthly: { n: annual.n, d: annual.d * 12n } },
    highLosses: losses >= HIGH_LOSSES
  };
}

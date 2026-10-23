/**
 * Solar system size from the energy to cover (B1-19, input-only rescope).
 *
 * - Size (kW DC) = annual kWh ÷ (peak sun hours × 365 × (1 − losses ÷ 100)).
 * - Optional panel count = the smallest whole number n with
 *   n × panel watts ≥ size in watts, from the exact decimals as entered, so
 *   exactly 5 kW of 500 W panels is 10 panels, never 11.
 * The displayed size is rounded once from the exact value.
 */

import { exactRatio, multiplyRatios, divideRatios, ceilRatio } from '../../lib/energy/money.js';
import { checkSunAndLosses, usableFraction, usableFractionRatio, range, finite, DAYS_PER_YEAR, HIGH_LOSSES } from './solar-sun-hours.js';

export const SIZE_LIMITS = Object.freeze({
  annualKwh: { min: 1, max: 10_000_000 },
  panelWatts: { min: 1, max: 2000 }
});

/**
 * @param {object} input
 * @param {number} input.annualKwh energy to cover in a year
 * @param {number} input.sunHours peak sun hours per day
 * @param {number} input.losses system losses, percent
 * @param {number | null} [input.panelWatts] one panel's rating, or null for no count
 */
export function calculateSolarPanelSize({ annualKwh, sunHours, losses, panelWatts = null }) {
  range('annualKwh', annualKwh, SIZE_LIMITS.annualKwh);
  checkSunAndLosses(sunHours, losses);
  if (panelWatts !== null) range('panelWatts', panelWatts, SIZE_LIMITS.panelWatts);

  const sizeKw = finite('sunHours', annualKwh / (sunHours * DAYS_PER_YEAR * usableFraction(losses)));
  const sizeKwRatio = divideRatios(exactRatio([annualKwh]), multiplyRatios(exactRatio([sunHours, DAYS_PER_YEAR]), usableFractionRatio(losses)));
  const panels = panelWatts === null ? null : ceilRatio(divideRatios(multiplyRatios(sizeKwRatio, { n: 1000n, d: 1n }), exactRatio([panelWatts])));
  return { sizeKw, sizeKwRatio, panels, highLosses: losses >= HIGH_LOSSES };
}

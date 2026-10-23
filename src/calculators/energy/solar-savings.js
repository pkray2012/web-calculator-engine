/**
 * Yearly bill savings from solar (B2-6). The export credit is the user's own
 * figure from their plan: no default and no claim about any billing program.
 *
 * - Self-used kWh = production × share used at home ÷ 100; exported = the rest.
 * - Savings = self-used kWh × retail rate + exported kWh × export credit − solar fees.
 * - Per month = savings ÷ 12; value per solar kWh = savings ÷ production,
 *   shown only for a production of at least 1 kWh.
 * The displayed amounts are rounded once each from the exact values (from the
 * decimals as entered); savings can be negative when fees are larger.
 */

import { exactRatio, addRatios, subtractRatios, multiplyRatios, divideRatios } from '../../lib/energy/money.js';
import { range, finite } from './solar-sun-hours.js';

export const SOLAR_SAVINGS_LIMITS = Object.freeze({
  production: { min: 0, max: 10_000_000 },
  selfUse: { min: 0, max: 100 },
  rate: { min: 0, max: 10 },
  feesCents: { min: 0, max: 100_000_000 }
});

export const HIGH_RATE = 1; // dollars per kWh

/**
 * @param {object} input
 * @param {number} input.production yearly solar production, kWh
 * @param {number} input.selfUse share used at home, percent
 * @param {number} input.retailRate dollars per kWh for each extra kWh bought
 * @param {number} input.exportRate dollars per kWh credited for each kWh exported
 * @param {number} [input.feesCents] yearly solar fees, whole cents
 */
export function calculateSolarSavings({ production, selfUse, retailRate, exportRate, feesCents = 0 }) {
  range('production', production, SOLAR_SAVINGS_LIMITS.production);
  range('selfUse', selfUse, SOLAR_SAVINGS_LIMITS.selfUse);
  range('retailRate', retailRate, SOLAR_SAVINGS_LIMITS.rate);
  range('exportRate', exportRate, SOLAR_SAVINGS_LIMITS.rate);
  if (!Number.isSafeInteger(feesCents)) throw new RangeError('feesCents must be whole cents');
  range('feesCents', feesCents, SOLAR_SAVINGS_LIMITS.feesCents);

  const selfKwh = finite('production', production * selfUse / 100);
  const exportedKwh = finite('production', production - selfKwh);
  const usedValue = finite('retailRate', selfKwh * retailRate);
  const exportValue = finite('exportRate', exportedKwh * exportRate);
  const savings = usedValue + exportValue - feesCents / 100;

  const p = exactRatio([production]);
  const share = exactRatio([selfUse], [100]);
  const self = multiplyRatios(p, share);
  const exported = subtractRatios(p, self);
  const exact = subtractRatios(
    addRatios(multiplyRatios(self, exactRatio([retailRate])), multiplyRatios(exported, exactRatio([exportRate]))),
    { n: BigInt(feesCents), d: 100n }
  );
  const perKwh = production >= 1;
  return {
    selfKwh,
    exportedKwh,
    usedValue,
    exportValue,
    savings,
    savingsPerMonth: savings / 12,
    centsPerSolarKwh: perKwh ? savings / production * 100 : null,
    exact: {
      selfKwh: self,
      exportedKwh: exported,
      savings: exact,
      savingsPerMonth: { n: exact.n, d: exact.d * 12n },
      centsPerSolarKwh: perKwh ? multiplyRatios(divideRatios(exact, p), { n: 100n, d: 1n }) : null
    },
    highRate: retailRate > HIGH_RATE || exportRate > HIGH_RATE,
    exportAboveRetail: exportRate > retailRate,
    feesAboveSavings: exact.n < 0n
  };
}

/**
 * Cost per kWh from an electric bill.
 *
 * - Average cost per kWh = bill ÷ kWh used, in cents.
 * - Rate after entered exclusions = (bill − the charges the user excludes) ÷
 *   kWh used, in cents. It can still include per-kWh delivery charges, riders
 *   and taxes; it equals the plan's energy rate only if every other charge
 *   was excluded. Neither is the price of one more kWh.
 * Amounts are whole cents, so the subtraction is exact. User-input
 * arithmetic only: no claim about how utilities set or define rates.
 */

export const RATE_LIMITS = Object.freeze({
  maxBillCents: 100_000_000, // $1,000,000
  minBillCents: 1,
  kwh: { min: 1, max: 10_000_000 }
});

export const HIGH_AVERAGE_CENTS = 100; // cents per kWh

/**
 * @param {object} input
 * @param {number} input.billCents bill total, in whole cents
 * @param {number} input.kwh kWh used in the billing period
 * @param {number} [input.excludedCents] charges left out of the rate, in whole cents
 */
export function calculateElectricityRate({ billCents, kwh, excludedCents = 0 }) {
  const L = RATE_LIMITS;
  if (!Number.isSafeInteger(billCents) || billCents < L.minBillCents || billCents > L.maxBillCents) throw new RangeError('billCents out of range');
  if (!Number.isFinite(kwh) || kwh < L.kwh.min || kwh > L.kwh.max) throw new RangeError(`kwh must be ${L.kwh.min} to ${L.kwh.max}`);
  if (!Number.isSafeInteger(excludedCents) || excludedCents < 0) throw new RangeError('excludedCents out of range');
  if (excludedCents > billCents) throw new RangeError('excludedCents cannot be more than billCents');

  const averageCentsPerKwh = billCents / kwh;
  return {
    averageCentsPerKwh,
    residualCentsPerKwh: (billCents - excludedCents) / kwh,
    bill: billCents / 100,
    excluded: excludedCents / 100,
    allExcluded: excludedCents === billCents,
    highAverage: averageCentsPerKwh > HIGH_AVERAGE_CENTS
  };
}

/**
 * Monthly utility total from this month's bills.
 *
 * - Total = the sum of the bills entered, in whole cents.
 * - Each bill's share = bill ÷ total × 100, shown only when the total is above 0.
 * - 12 × this month's total is shown for budgeting; it is not a forecast,
 *   because bills vary by month and no seasonal adjustment is applied.
 */

export const UTILITY_CATEGORIES = Object.freeze(['electricity', 'gas', 'water', 'sewer', 'trash', 'internet', 'other']);
export const MAX_BILL_CENTS = 100_000_000; // $1,000,000 a month for one bill

/**
 * @param {Partial<Record<string, number | null>>} billsCents each bill in whole cents; null or missing = not entered
 */
export function calculateUtilityCost(billsCents) {
  const entered = {};
  for (const [category, cents] of Object.entries(billsCents)) {
    if (!UTILITY_CATEGORIES.includes(category)) throw new RangeError(`unknown category ${category}`);
    if (cents === null || cents === undefined) continue;
    if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_BILL_CENTS) {
      throw new RangeError(`${category} must be a whole number of cents from 0 to ${MAX_BILL_CENTS}`);
    }
    entered[category] = cents;
  }
  const totalCents = Object.values(entered).reduce((sum, cents) => sum + cents, 0);
  return {
    totalCents,
    monthly: totalCents / 100,
    twelveTimesMonthly: (totalCents * 12) / 100,
    shares: totalCents > 0
      ? Object.fromEntries(Object.entries(entered).map(([category, cents]) => [category, (cents / totalCents) * 100]))
      : null
  };
}

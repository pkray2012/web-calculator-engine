/**
 * Simple payback period for a solar system (DOE simple payback: no time value
 * of money, no price changes, no panel degradation).
 *
 * - Net cost = installed cost − incentives received.
 * - Net yearly savings = yearly bill savings − yearly maintenance.
 * - Payback (years) = net cost ÷ net yearly savings, defined only when net
 *   savings are above 0. A net cost of 0 is recovered at installation.
 * All amounts are whole cents, so the comparisons are exact.
 */

export const MAX_AMOUNT_CENTS = 10_000_000_000; // $100,000,000

function cents(name, value, min = 0) {
  if (!Number.isSafeInteger(value) || value < min || value > MAX_AMOUNT_CENTS) throw new RangeError(`${name} must be whole cents from ${min} to ${MAX_AMOUNT_CENTS}`);
}

/**
 * @param {object} input
 * @param {number} input.costCents installed cost
 * @param {number} input.savingsCents yearly bill savings
 * @param {number} [input.incentivesCents] incentives received
 * @param {number} [input.maintenanceCents] yearly maintenance
 * @returns {{ outcome: 'payback' | 'recovered' | 'undefined', years: number | null, netCostCents: number, netSavingsCents: number }}
 */
export function calculateSimplePayback({ costCents, savingsCents, incentivesCents = 0, maintenanceCents = 0 }) {
  cents('costCents', costCents, 1);
  cents('savingsCents', savingsCents);
  cents('maintenanceCents', maintenanceCents);
  if (!Number.isSafeInteger(incentivesCents) || incentivesCents < 0) throw new RangeError('incentivesCents must be whole cents, 0 or more');
  if (incentivesCents > costCents) throw new RangeError('incentives cannot exceed the installed cost');

  const netCostCents = costCents - incentivesCents;
  const netSavingsCents = savingsCents - maintenanceCents;
  if (netCostCents === 0) return { outcome: 'recovered', years: 0, netCostCents, netSavingsCents };
  if (netSavingsCents < 1) return { outcome: 'undefined', years: null, netCostCents, netSavingsCents };
  return { outcome: 'payback', years: netCostCents / netSavingsCents, netCostCents, netSavingsCents };
}

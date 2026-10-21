/**
 * Solar price per watt.
 *
 * - Gross $/W = installed price ÷ system size in watts.
 * - Net $/W = (installed price − incentives received) ÷ system size in watts.
 * - Size is entered in kW (× 1,000) or W. Use the DC rating on the quote,
 *   so quotes compare on the same basis.
 */

export const MAX_PRICE_CENTS = 10_000_000_000; // $100,000,000
export const SIZE_LIMITS = Object.freeze({ kW: { min: 0.001, max: 1000 }, W: { min: 1, max: 1_000_000 } });

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  return value;
}

/**
 * @param {object} input
 * @param {number} input.priceCents installed price in whole cents
 * @param {number} input.size system size in the unit given
 * @param {'kW' | 'W'} input.unit
 * @param {number} [input.incentivesCents] incentives received, in whole cents
 */
export function calculatePricePerWatt({ priceCents, size, unit, incentivesCents = 0 }) {
  if (!Number.isSafeInteger(priceCents) || priceCents < 1 || priceCents > MAX_PRICE_CENTS) throw new RangeError('priceCents must be 1 to 10,000,000,000');
  const limits = SIZE_LIMITS[unit];
  if (!limits) throw new RangeError('unit must be kW or W');
  finite('size', size);
  if (size < limits.min || size > limits.max) throw new RangeError(`size must be ${limits.min} to ${limits.max} ${unit}`);
  if (!Number.isSafeInteger(incentivesCents) || incentivesCents < 0) throw new RangeError('incentivesCents must be a whole number of cents, 0 or more');
  if (incentivesCents > priceCents) throw new RangeError('incentives cannot exceed the price');

  const watts = unit === 'kW' ? size * 1000 : size;
  if (watts < 1 - 1e-9 || watts > 1_000_000) throw new RangeError('size must be between 1 W and 1,000 kW');
  return {
    watts,
    grossPerWatt: finite('size', priceCents / 100 / watts),
    netPerWatt: finite('size', (priceCents - incentivesCents) / 100 / watts),
    netPriceCents: priceCents - incentivesCents
  };
}

/**
 * Percentages. The symbol % stands for the number 0.01 (NIST SP 811, 7.10.2),
 * so p% of y is p × 0.01 × y.
 *
 * - Percent of: p% of y = y × p ÷ 100.
 * - What percent: x is (x ÷ y × 100)% of y.
 * - Percent change from a to b: (b − a) ÷ |a| × 100; the difference in
 *   percentage terms is not symmetric (a 50% rise is undone by a 33.3% fall).
 * - Percent difference (no direction): |a − b| ÷ ((|a| + |b|) ÷ 2) × 100.
 * - Percent off: sale price = price × (1 − p ÷ 100), saving = price × p ÷ 100.
 *   Two discounts in a row multiply: 20% then 10% off is 28% off, not 30%.
 */

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

export function percentOf({ percent, of }) {
  finite('percent', percent);
  finite('of', of);
  return { percent, of, result: (of * percent) / 100 };
}

export function whatPercent({ part, whole }) {
  finite('part', part);
  finite('whole', whole);
  if (whole === 0) throw new RangeError('whole cannot be 0');
  return { part, whole, percent: (part / whole) * 100 };
}

export function percentChange({ from, to }) {
  finite('from', from);
  finite('to', to);
  if (from === 0) throw new RangeError('from cannot be 0');
  const change = to - from;
  const mean = (Math.abs(from) + Math.abs(to)) / 2;
  return {
    from,
    to,
    change,
    percent: (change / Math.abs(from)) * 100,
    /** The percent change that would take `to` back to `from`. */
    reversePercent: to === 0 ? null : ((from - to) / Math.abs(to)) * 100,
    differencePercent: mean === 0 ? 0 : (Math.abs(change) / mean) * 100
  };
}

export function percentOff({ price, percent, extraPercent = 0 }) {
  finite('price', price);
  finite('percent', percent);
  finite('extraPercent', extraPercent);
  if (price < 0) throw new RangeError('price cannot be negative');
  for (const [name, value] of Object.entries({ percent, extraPercent })) {
    if (value < 0 || value > 100) throw new RangeError(`${name} must be between 0 and 100`);
  }
  const salePrice = price * (1 - percent / 100) * (1 - extraPercent / 100);
  return { price, percent, extraPercent, salePrice, saving: price - salePrice, totalPercentOff: price === 0 ? 0 : ((price - salePrice) / price) * 100 };
}

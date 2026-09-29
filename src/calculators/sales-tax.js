/**
 * Sales tax: add tax to a price, take it back out of a tax-included total,
 * or find the rate from a price and a total.
 *
 * - Add: tax = price × rate; total = price + tax.
 * - Remove: price = total ÷ (1 + rate); tax = total − price.
 * - Rate: rate = (total − price) ÷ price, with the range of rates whose
 *   tax rounds to the same cent.
 * Money results are rounded to the cent, half up, as a receipt shows them;
 * the unrounded tax is also returned. Rounding rules (per item or per
 * receipt) differ between states and sellers, so a receipt can differ by a
 * cent.
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/** Round to the cent, half up, without binary artifacts (1.005 → 1.01). */
export const roundCents = (value) => Math.round((value + Number.EPSILON * Math.max(1, Math.abs(value))) * 100) / 100;

export function addSalesTax({ price, ratePercent }) {
  nonNegative('price', price);
  nonNegative('ratePercent', ratePercent);
  const exactTax = price * ratePercent / 100;
  const tax = roundCents(exactTax);
  return { price, ratePercent, exactTax, tax, total: roundCents(price + tax) };
}

export function removeSalesTax({ total, ratePercent }) {
  nonNegative('total', total);
  nonNegative('ratePercent', ratePercent);
  const exactPrice = total / (1 + ratePercent / 100);
  const price = roundCents(exactPrice);
  return { total, ratePercent, exactPrice, price, tax: roundCents(total - price), exactTax: total - exactPrice };
}

export function findSalesTaxRate({ price, total }) {
  nonNegative('price', price);
  nonNegative('total', total);
  if (price <= 0) throw new RangeError('price must be greater than 0');
  if (total < price) throw new RangeError('total cannot be less than the price');
  const tax = total - price;
  // A receipt's tax is rounded to the cent, so any rate whose exact tax
  // rounds to the same cent is consistent with it.
  return {
    price,
    total,
    tax: roundCents(tax),
    ratePercent: (tax / price) * 100,
    rateLowPercent: (Math.max(0, tax - 0.005) / price) * 100,
    rateHighPercent: ((tax + 0.005) / price) * 100
  };
}

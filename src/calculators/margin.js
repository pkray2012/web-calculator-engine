/**
 * Profit margin and markup on a sale.
 *
 * - Profit = price − cost.
 * - Margin (gross margin) = profit ÷ price: the share of the selling price
 *   that is profit.
 * - Markup = profit ÷ cost: how much is added on top of cost.
 * - The two describe the same sale: margin = markup ÷ (1 + markup) and
 *   markup = margin ÷ (1 − margin).
 * - Price from a target margin: cost ÷ (1 − margin). Price from a markup:
 *   cost × (1 + markup).
 * - Optional break-even: fixed costs ÷ (price − cost per unit), rounded up to
 *   whole units (the SBA's break-even formula, with cost as the variable
 *   cost per unit).
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

const EPSILON = 1e-9;

/** Margin and markup for a cost and a price. */
export function analyzeSale({ cost, price, fixedCosts = 0 }) {
  nonNegative('cost', cost);
  nonNegative('price', price);
  nonNegative('fixedCosts', fixedCosts);
  if (price <= 0) throw new RangeError('price must be greater than 0');
  const profit = price - cost;
  const breakEvenUnits = fixedCosts > 0 && profit > 0 ? Math.ceil(fixedCosts / profit - EPSILON) : null;
  return {
    cost,
    price,
    profit,
    marginPercent: (profit / price) * 100,
    markupPercent: cost > 0 ? (profit / cost) * 100 : null,
    fixedCosts,
    breakEvenUnits
  };
}

/** Selling price that gives a target margin on a cost. */
export function priceForMargin({ cost, marginPercent, fixedCosts = 0 }) {
  nonNegative('cost', cost);
  nonNegative('marginPercent', marginPercent);
  if (marginPercent >= 100) throw new RangeError('marginPercent must be less than 100');
  if (cost <= 0) throw new RangeError('cost must be greater than 0');
  return analyzeSale({ cost, price: cost / (1 - marginPercent / 100), fixedCosts });
}

/** Selling price from a markup on cost. */
export function priceForMarkup({ cost, markupPercent, fixedCosts = 0 }) {
  nonNegative('cost', cost);
  nonNegative('markupPercent', markupPercent);
  if (cost <= 0) throw new RangeError('cost must be greater than 0');
  return analyzeSale({ cost, price: cost * (1 + markupPercent / 100), fixedCosts });
}

export const marginFromMarkup = (markupPercent) => (markupPercent / (100 + markupPercent)) * 100;
export const markupFromMargin = (marginPercent) => (marginPercent / (100 - marginPercent)) * 100;

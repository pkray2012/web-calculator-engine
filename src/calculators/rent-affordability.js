/**
 * How much rent you can afford, three ways.
 *
 * - Cost-burden guideline: housing costs (rent + utilities) at or under a share
 *   of gross income, 30% by default (HUD's cost-burden line; over 50% is
 *   "severely cost-burdened"). Max rent = share × gross monthly − utilities.
 * - Landlord income screen: annual income of at least a multiple of the
 *   monthly rent, often 40 times. Max rent = annual income ÷ multiple.
 * - Budget: take-home pay minus debt payments, other essentials and savings,
 *   minus utilities.
 * - For a rent being considered: its cost burden ((rent + utilities) ÷ gross
 *   monthly income) and the income the landlord screen requires.
 * Results are never negative: a negative remainder means no rent fits.
 */

export const COST_BURDEN_SHARE = 30;
export const SEVERE_COST_BURDEN_SHARE = 50;

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/** "none" up to 30%, "burdened" over 30% up to 50%, "severe" over 50%. */
export function costBurdenLevel(sharePercent) {
  if (sharePercent > SEVERE_COST_BURDEN_SHARE) return 'severe';
  if (sharePercent > COST_BURDEN_SHARE) return 'burdened';
  return 'none';
}

export function calculateRentAffordability({
  annualGrossIncome,
  monthlyUtilities = 0,
  housingSharePercent = COST_BURDEN_SHARE,
  incomeMultiple = 40,
  monthlyTakeHome = null,
  monthlyDebts = 0,
  monthlyEssentials = 0,
  monthlySavings = 0,
  rentConsidered = null
}) {
  nonNegative('annualGrossIncome', annualGrossIncome);
  nonNegative('monthlyUtilities', monthlyUtilities);
  nonNegative('housingSharePercent', housingSharePercent);
  if (housingSharePercent > 100) throw new RangeError('housingSharePercent cannot exceed 100');
  if (!Number.isFinite(incomeMultiple) || incomeMultiple <= 0) throw new RangeError('incomeMultiple must be greater than 0');
  for (const [name, value] of Object.entries({ monthlyDebts, monthlyEssentials, monthlySavings })) nonNegative(name, value);
  if (monthlyTakeHome !== null) nonNegative('monthlyTakeHome', monthlyTakeHome);
  if (rentConsidered !== null) nonNegative('rentConsidered', rentConsidered);

  const grossMonthly = annualGrossIncome / 12;
  const guidelineHousingCost = grossMonthly * housingSharePercent / 100;
  const guidelineRent = Math.max(0, guidelineHousingCost - monthlyUtilities);
  const severeRent = Math.max(0, grossMonthly * SEVERE_COST_BURDEN_SHARE / 100 - monthlyUtilities);
  const screenRent = annualGrossIncome / incomeMultiple;

  let budget = null;
  if (monthlyTakeHome !== null) {
    const leftForHousing = monthlyTakeHome - monthlyDebts - monthlyEssentials - monthlySavings;
    budget = { leftForHousing, rent: Math.max(0, leftForHousing - monthlyUtilities) };
  }

  let considered = null;
  if (rentConsidered !== null) {
    const burdenPercent = grossMonthly > 0 ? (rentConsidered + monthlyUtilities) / grossMonthly * 100 : null;
    considered = {
      rent: rentConsidered,
      burdenPercent,
      burdenLevel: burdenPercent === null ? null : costBurdenLevel(burdenPercent),
      incomeNeededForScreen: rentConsidered * incomeMultiple,
      passesScreen: annualGrossIncome >= rentConsidered * incomeMultiple,
      leftAfterHousing: budget === null ? null : budget.leftForHousing - monthlyUtilities - rentConsidered
    };
  }

  return {
    annualGrossIncome,
    grossMonthly,
    monthlyUtilities,
    housingSharePercent,
    incomeMultiple,
    guidelineHousingCost,
    guidelineRent,
    severeRent,
    screenRent,
    budget,
    considered,
    // The lowest of the available limits.
    lowestRent: Math.min(guidelineRent, screenRent, budget === null ? Infinity : budget.rent)
  };
}

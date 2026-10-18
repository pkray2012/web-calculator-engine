/**
 * How much rent you can afford, three ways.
 *
 * - Cost-burden guideline: housing costs (rent + utilities) at or under a share
 *   of gross income, 30% by default (HUD's cost-burden line; over 50% is
 *   "severely cost-burdened"). Max rent = share × gross monthly − utilities.
 * - Landlord income screen: annual income of at least a multiple of the
 *   monthly rent, such as 40 times. Max rent = annual income ÷ multiple.
 * - Budget: take-home pay minus debt payments, other essentials and savings,
 *   minus utilities.
 * - For a rent being considered: its cost burden ((rent + utilities) ÷ gross
 *   monthly income) and the income the landlord screen requires.
 * Results are never negative: a negative remainder means no rent fits.
 * Maximum rents are rounded down to the cent, so a displayed maximum always
 * passes its own test when entered back in; comparisons against a limit
 * allow a millionth of a dollar for floating-point remainders.
 */

export const COST_BURDEN_SHARE = 30;
export const SEVERE_COST_BURDEN_SHARE = 50;
const MONEY_EPSILON = 1e-6;

/** The highest whole-cent amount not above the value (never negative). */
const floorCents = (value) => Math.max(0, Math.floor(value * 100 + 1e-7) / 100);

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/**
 * "none" up to 30% of monthly income, "burdened" over 30% up to 50%,
 * "severe" over 50% (HUD's "exceeding" wording), compared in dollars.
 */
export function costBurdenLevel(housingCost, grossMonthly) {
  if (housingCost - grossMonthly * SEVERE_COST_BURDEN_SHARE / 100 > MONEY_EPSILON) return 'severe';
  if (housingCost - grossMonthly * COST_BURDEN_SHARE / 100 > MONEY_EPSILON) return 'burdened';
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
  const guidelineRent = floorCents(guidelineHousingCost - monthlyUtilities);
  const severeRent = floorCents(grossMonthly * SEVERE_COST_BURDEN_SHARE / 100 - monthlyUtilities);
  const screenRent = floorCents(annualGrossIncome / incomeMultiple);

  let budget = null;
  if (monthlyTakeHome !== null) {
    const leftForHousing = monthlyTakeHome - monthlyDebts - monthlyEssentials - monthlySavings;
    budget = { leftForHousing, rent: floorCents(leftForHousing - monthlyUtilities) };
  }

  let considered = null;
  if (rentConsidered !== null) {
    const burdenPercent = grossMonthly > 0 ? (rentConsidered + monthlyUtilities) / grossMonthly * 100 : null;
    considered = {
      rent: rentConsidered,
      burdenPercent,
      burdenLevel: burdenPercent === null ? null : costBurdenLevel(rentConsidered + monthlyUtilities, grossMonthly),
      incomeNeededForScreen: rentConsidered * incomeMultiple,
      passesScreen: annualGrossIncome > 0 && annualGrossIncome - rentConsidered * incomeMultiple >= -MONEY_EPSILON,
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

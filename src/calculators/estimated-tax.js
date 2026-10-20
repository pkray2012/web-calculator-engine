/**
 * Federal quarterly estimated tax: the safe-harbor amount to pay so no
 * underpayment penalty applies (Form 1040-ES / Form 2210 rules).
 *
 * - "Tax" in every test is total tax minus refundable credits (Publication
 *   505 Worksheet 2-1; Form 2210 line 3), for both years (review ZA-006).
 * - Required annual payment = the smaller of
 *     90% of this year's tax, and
 *     100% of last year's tax (110% if last year's AGI was over $150,000, or
 *     over $75,000 if married filing separately).
 *   Without last year's tax, only the 90% test is used.
 * - Withholding counts as paid evenly through the year, so the estimated
 *   payments needed = max(0, required annual payment − withholding), split
 *   into four equal installments.
 * - No estimated payments are needed when this year's tax minus withholding
 *   is under $1,000, or when last year's tax was zero (for a full 12-month
 *   tax year as a U.S. citizen or resident).
 * - To owe nothing at filing instead, pay this year's tax minus withholding.
 * Not covered: other worksheet adjustments (such as certain excluded taxes),
 * the annualized income installment method for uneven income, the farmer and
 * fisherman rules, and state estimated taxes.
 */

export const ESTIMATED_TAX_DUE_DATES = Object.freeze({
  2026: Object.freeze(['2026-04-15', '2026-06-15', '2026-09-15', '2027-01-15'])
});
export const ESTIMATED_TAX_YEARS = Object.freeze(Object.keys(ESTIMATED_TAX_DUE_DATES).map(Number));

export const CURRENT_YEAR_SHARE = 0.9;
export const HIGH_INCOME_PRIOR_YEAR_SHARE = 1.1;
export const HIGH_INCOME_AGI = 150000;
export const HIGH_INCOME_AGI_SEPARATE = 75000;
export const MINIMUM_BALANCE_DUE = 1000;

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

export function calculateEstimatedTax({
  taxYear,
  currentYearTax,
  currentYearRefundableCredits = 0,
  withholding = 0,
  priorYearTax = null,
  priorYearRefundableCredits = 0,
  priorYearAgi = null,
  marriedFilingSeparately = false
}) {
  if (!(taxYear in ESTIMATED_TAX_DUE_DATES)) throw new RangeError(`taxYear must be one of ${ESTIMATED_TAX_YEARS.join(', ')}`);
  nonNegative('currentYearTax', currentYearTax);
  nonNegative('currentYearRefundableCredits', currentYearRefundableCredits);
  nonNegative('priorYearRefundableCredits', priorYearRefundableCredits);
  nonNegative('withholding', withholding);
  if (priorYearTax !== null) nonNegative('priorYearTax', priorYearTax);
  if (priorYearAgi !== null) nonNegative('priorYearAgi', priorYearAgi);

  // The tax the safe-harbor and $1,000 tests use: total tax minus refundable credits.
  const currentYearTaxShown = Math.max(0, currentYearTax - currentYearRefundableCredits);
  const priorYearTaxShown = priorYearTax === null ? null : Math.max(0, priorYearTax - priorYearRefundableCredits);

  const currentYearTest = CURRENT_YEAR_SHARE * currentYearTaxShown;
  const agiLimit = marriedFilingSeparately ? HIGH_INCOME_AGI_SEPARATE : HIGH_INCOME_AGI;
  const highIncome = priorYearAgi !== null && priorYearAgi > agiLimit;
  const priorYearShare = highIncome ? HIGH_INCOME_PRIOR_YEAR_SHARE : 1;
  const priorYearTest = priorYearTaxShown === null ? null : priorYearShare * priorYearTaxShown;
  const requiredAnnualPayment = priorYearTest === null ? currentYearTest : Math.min(currentYearTest, priorYearTest);
  const safeHarborUsed = priorYearTest !== null && priorYearTest < currentYearTest ? 'priorYear' : 'currentYear';

  const balanceAfterWithholding = Math.max(0, currentYearTaxShown - withholding);
  const underMinimum = balanceAfterWithholding < MINIMUM_BALANCE_DUE;
  const noPriorYearTax = priorYearTax === 0;
  const paymentsRequired = !underMinimum && !noPriorYearTax;

  const safeHarborTotal = paymentsRequired ? Math.max(0, requiredAnnualPayment - withholding) : 0;
  const payInFullTotal = balanceAfterWithholding;
  const dueDates = ESTIMATED_TAX_DUE_DATES[taxYear];

  return {
    taxYear,
    currentYearTax,
    currentYearRefundableCredits,
    currentYearTaxShown,
    withholding,
    priorYearTax,
    priorYearRefundableCredits,
    priorYearTaxShown,
    priorYearAgi,
    currentYearTest,
    priorYearShare,
    priorYearTest,
    highIncome,
    requiredAnnualPayment,
    safeHarborUsed,
    balanceAfterWithholding,
    underMinimum,
    noPriorYearTax,
    paymentsRequired,
    safeHarborTotal,
    safeHarborInstallment: safeHarborTotal / 4,
    // What is still owed at filing if only the safe-harbor amount is paid.
    dueAtFilingWithSafeHarbor: Math.max(0, currentYearTaxShown - withholding - safeHarborTotal),
    payInFullTotal,
    payInFullInstallment: payInFullTotal / 4,
    dueDates
  };
}

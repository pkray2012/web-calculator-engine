/**
 * Self-employment tax (Schedule SE, regular method) and the Additional
 * Medicare Tax on self-employment income (Form 8959, Part II).
 *
 * - Net earnings NE = 92.35% × net profit; no SE tax when NE is under $400.
 * - Social Security part = 12.4% × NE, but only up to the wage base left after
 *   W-2 Social Security wages: 12.4% × min(NE, max(0, wageBase − ssWages)).
 * - Medicare part = 2.9% × NE (no cap).
 * - SE tax = Social Security part + Medicare part; half of it is deductible
 *   in figuring adjusted gross income.
 * - Additional Medicare Tax = 0.9% × max(0, NE − max(0, threshold − medicareWages)).
 *   It is reported on Form 8959, is not part of SE tax and is not deductible.
 * Precision is kept throughout; callers round only for display.
 * Out of scope: optional methods, church employee income, farm income
 * rules, income tax, state taxes.
 */

/** Social Security contribution and benefit base by tax year (SSA). */
export const SOCIAL_SECURITY_WAGE_BASE = Object.freeze({ 2025: 176100, 2026: 184500 });
export const TAX_YEARS = Object.freeze(Object.keys(SOCIAL_SECURITY_WAGE_BASE).map(Number));

/** Additional Medicare Tax thresholds by filing status; not indexed for inflation. */
export const ADDITIONAL_MEDICARE_THRESHOLD = Object.freeze({
  single: 200000,
  headOfHousehold: 200000,
  qualifyingSurvivingSpouse: 200000,
  marriedJointly: 250000,
  marriedSeparately: 125000
});

export const NET_EARNINGS_FACTOR = 0.9235;
export const SOCIAL_SECURITY_RATE = 0.124;
export const MEDICARE_RATE = 0.029;
export const ADDITIONAL_MEDICARE_RATE = 0.009;
export const MINIMUM_NET_EARNINGS = 400;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

export function calculateSelfEmploymentTax({
  taxYear,
  netProfit,
  socialSecurityWages = 0,
  medicareWages = socialSecurityWages,
  filingStatus = 'single'
}) {
  if (!(taxYear in SOCIAL_SECURITY_WAGE_BASE)) throw new RangeError(`taxYear must be one of ${TAX_YEARS.join(', ')}`);
  if (!(filingStatus in ADDITIONAL_MEDICARE_THRESHOLD)) throw new RangeError('filingStatus is not recognized');
  finite('netProfit', netProfit);
  nonNegative('socialSecurityWages', socialSecurityWages);
  nonNegative('medicareWages', medicareWages);

  const wageBase = SOCIAL_SECURITY_WAGE_BASE[taxYear];
  const threshold = ADDITIONAL_MEDICARE_THRESHOLD[filingStatus];
  const rawNetEarnings = Math.max(0, netProfit) * NET_EARNINGS_FACTOR;
  const belowMinimum = rawNetEarnings < MINIMUM_NET_EARNINGS;
  const netEarnings = belowMinimum ? 0 : rawNetEarnings;

  const wageBaseLeft = Math.max(0, wageBase - socialSecurityWages);
  const socialSecurityEarnings = Math.min(netEarnings, wageBaseLeft);
  const socialSecurityTax = socialSecurityEarnings * SOCIAL_SECURITY_RATE;
  const medicareTax = netEarnings * MEDICARE_RATE;
  const selfEmploymentTax = socialSecurityTax + medicareTax;

  const thresholdLeft = Math.max(0, threshold - medicareWages);
  const additionalMedicareEarnings = Math.max(0, netEarnings - thresholdLeft);
  const additionalMedicareTax = additionalMedicareEarnings * ADDITIONAL_MEDICARE_RATE;

  return {
    taxYear,
    filingStatus,
    netProfit,
    socialSecurityWages,
    medicareWages,
    wageBase,
    threshold,
    rawNetEarnings,
    belowMinimum,
    netEarnings,
    wageBaseLeft,
    socialSecurityEarnings,
    socialSecurityCapped: netEarnings > wageBaseLeft,
    socialSecurityTax,
    medicareTax,
    selfEmploymentTax,
    deductibleHalf: selfEmploymentTax / 2,
    thresholdLeft,
    additionalMedicareEarnings,
    additionalMedicareTax,
    totalWithAdditionalMedicare: selfEmploymentTax + additionalMedicareTax,
    effectiveRateOnProfit: netProfit > 0 ? (selfEmploymentTax + additionalMedicareTax) / netProfit : 0
  };
}

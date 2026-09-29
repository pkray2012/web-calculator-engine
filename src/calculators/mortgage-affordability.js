import { monthlyPayment } from './loan-payment.js';

function assertFiniteNumber(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function validateInputs({
  annualIncome,
  monthlyDebt,
  downPayment,
  annualRate,
  termYears,
  frontEndRatio,
  backEndRatio,
  annualPropertyTax,
  annualInsurance,
  monthlyHoa,
  annualPmiRate,
  propertyTaxRate = 0
}) {
  const values = {
    annualIncome,
    monthlyDebt,
    downPayment,
    annualRate,
    termYears,
    frontEndRatio,
    backEndRatio,
    annualPropertyTax,
    annualInsurance,
    monthlyHoa,
    annualPmiRate,
    propertyTaxRate
  };

  for (const [name, value] of Object.entries(values)) assertFiniteNumber(name, value);

  if (annualIncome <= 0) throw new RangeError('annualIncome must be greater than 0');
  if (monthlyDebt < 0) throw new RangeError('monthlyDebt cannot be negative');
  if (downPayment < 0) throw new RangeError('downPayment cannot be negative');
  if (annualRate < 0) throw new RangeError('annualRate cannot be negative');
  if (!Number.isInteger(termYears) || termYears <= 0) {
    throw new RangeError('termYears must be a positive integer');
  }
  if (frontEndRatio <= 0 || frontEndRatio > 1) {
    throw new RangeError('frontEndRatio must be greater than 0 and no greater than 1');
  }
  if (backEndRatio <= 0 || backEndRatio > 1) {
    throw new RangeError('backEndRatio must be greater than 0 and no greater than 1');
  }
  if (annualPropertyTax < 0) throw new RangeError('annualPropertyTax cannot be negative');
  if (annualInsurance < 0) throw new RangeError('annualInsurance cannot be negative');
  if (monthlyHoa < 0) throw new RangeError('monthlyHoa cannot be negative');
  if (annualPmiRate < 0) throw new RangeError('annualPmiRate cannot be negative');
  if (propertyTaxRate < 0) throw new RangeError('propertyTaxRate cannot be negative');
}

function housingCostForPrice({
  homePrice,
  downPayment,
  annualRate,
  termYears,
  annualPropertyTax,
  annualInsurance,
  monthlyHoa,
  annualPmiRate,
  propertyTaxRate = 0
}) {
  const loanAmount = Math.max(0, homePrice - downPayment);
  const monthlyPrincipalAndInterest = loanAmount === 0
    ? 0
    : monthlyPayment({ principal: loanAmount, annualRate, termMonths: termYears * 12 });
  const monthlyTax = (annualPropertyTax + homePrice * propertyTaxRate / 100) / 12;
  const monthlyInsurance = annualInsurance / 12;
  const loanToValue = homePrice > 0 ? loanAmount / homePrice : 0;
  const monthlyPmi = loanToValue > 0.8 ? loanAmount * annualPmiRate / 100 / 12 : 0;
  const monthlyHousingCost = monthlyPrincipalAndInterest + monthlyTax + monthlyInsurance + monthlyHoa + monthlyPmi;

  return {
    homePrice,
    loanAmount,
    downPaymentPercent: homePrice > 0 ? downPayment / homePrice * 100 : 0,
    loanToValue: loanToValue * 100,
    principalAndInterest: monthlyPrincipalAndInterest,
    propertyTax: monthlyTax,
    insurance: monthlyInsurance,
    hoa: monthlyHoa,
    pmi: monthlyPmi,
    monthlyHousingCost
  };
}

export function calculateMortgageAffordability(input) {
  validateInputs(input);

  const grossMonthlyIncome = input.annualIncome / 12;
  const frontEndCap = grossMonthlyIncome * input.frontEndRatio;
  const backEndCap = grossMonthlyIncome * input.backEndRatio - input.monthlyDebt;
  const housingPaymentCap = Math.max(0, Math.min(frontEndCap, backEndCap));

  const fixedMonthlyCost = housingCostForPrice({ ...input, homePrice: 0 }).monthlyHousingCost;
  if (housingPaymentCap === 0 || fixedMonthlyCost > housingPaymentCap) {
    return {
      maxHomePrice: 0,
      loanAmount: 0,
      housingPaymentCap,
      frontEndCap,
      backEndCap,
      grossMonthlyIncome,
      monthlyHousingCost: 0,
      principalAndInterest: 0,
      propertyTax: 0,
      insurance: 0,
      hoa: input.monthlyHoa,
      pmi: 0,
      downPaymentPercent: 0,
      loanToValue: 0,
      frontEndDti: 0,
      backEndDti: input.monthlyDebt > 0 ? input.monthlyDebt / grossMonthlyIncome * 100 : 0
    };
  }

  const monthlyTerm = input.termYears * 12;
  let low = 0;
  let high = Math.max(input.downPayment + housingPaymentCap * monthlyTerm, 1);

  while (
    housingCostForPrice({ ...input, homePrice: high }).monthlyHousingCost <= housingPaymentCap &&
    high < 100_000_000
  ) {
    high *= 2;
  }

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const cost = housingCostForPrice({ ...input, homePrice: mid }).monthlyHousingCost;
    if (cost <= housingPaymentCap) low = mid;
    else high = mid;
  }

  const result = housingCostForPrice({ ...input, homePrice: low });
  const frontEndDti = result.monthlyHousingCost / grossMonthlyIncome * 100;
  const backEndDti = (result.monthlyHousingCost + input.monthlyDebt) / grossMonthlyIncome * 100;

  return {
    ...result,
    maxHomePrice: result.homePrice,
    housingPaymentCap,
    frontEndCap,
    backEndCap,
    grossMonthlyIncome,
    frontEndDti,
    backEndDti
  };
}

/**
 * The affordability result plus the comparisons the page shows: which ratio
 * limits the budget, the price at a rate one point lower and higher, and the
 * price if the other monthly debts were paid off (only when the back-end
 * ratio is the binding limit, since otherwise debts do not change the price).
 */
export function calculateAffordabilityPlan(input) {
  const result = calculateMortgageAffordability(input);
  const binding = result.frontEndCap <= result.backEndCap ? 'front' : 'back';
  const rateScenarios = [input.annualRate - 1, input.annualRate, input.annualRate + 1]
    .filter((annualRate) => annualRate >= 0)
    .map((annualRate) => ({
      annualRate,
      current: annualRate === input.annualRate,
      ...pick(annualRate === input.annualRate ? result : calculateMortgageAffordability({ ...input, annualRate }))
    }));
  const withoutDebt = binding === 'back' && input.monthlyDebt > 0
    ? pick(calculateMortgageAffordability({ ...input, monthlyDebt: 0 }))
    : null;
  return { ...result, binding, rateScenarios, withoutDebt };
}

function pick({ maxHomePrice, loanAmount, monthlyHousingCost, principalAndInterest }) {
  return { maxHomePrice, loanAmount, monthlyHousingCost, principalAndInterest };
}

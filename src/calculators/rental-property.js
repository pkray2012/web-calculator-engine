/**
 * Rental property returns for a buy-and-hold purchase, first year.
 *
 * - Gross scheduled income GSI = 12 × (monthly rent + other monthly income).
 * - Effective gross income EGI = GSI × (1 − vacancy).
 * - Operating expenses = property tax + insurance + HOA + owner-paid
 *   utilities + (maintenance % + capital reserve % + management %) × EGI.
 * - Net operating income NOI = EGI − operating expenses. Loan payments,
 *   depreciation and income tax are not operating expenses.
 * - Cap rate = NOI ÷ purchase price.
 * - Annual debt service = 12 × the fixed-rate monthly payment.
 * - Cash flow = NOI − debt service.
 * - Cash invested = down payment + closing costs + upfront repairs.
 * - Cash-on-cash return = cash flow ÷ cash invested.
 * - DSCR = NOI ÷ debt service (none without a loan).
 * - Gross rent multiplier = price ÷ GSI.
 * - Break-even rent: the monthly rent at which cash flow is zero.
 * Percentage expenses are taken on collected income (EGI), so they fall
 * when units are vacant. Precision is kept throughout; callers round for
 * display. First-year figures only: no rent growth, appreciation, loan
 * paydown, tax effects or sale.
 */

import { monthlyPayment } from './loan-payment.js';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function percent(name, value, { max = 100 } = {}) {
  nonNegative(name, value);
  if (value > max) throw new RangeError(`${name} cannot exceed ${max}%`);
}

export function calculateRentalProperty({
  purchasePrice,
  downPaymentPercent,
  closingCosts = 0,
  repairCosts = 0,
  interestRate,
  termYears,
  monthlyRent,
  otherMonthlyIncome = 0,
  vacancyPercent = 0,
  propertyTaxYearly = 0,
  insuranceYearly = 0,
  hoaMonthly = 0,
  utilitiesMonthly = 0,
  maintenancePercent = 0,
  capexPercent = 0,
  managementPercent = 0
}) {
  finite('purchasePrice', purchasePrice);
  if (purchasePrice <= 0) throw new RangeError('purchasePrice must be greater than 0');
  percent('downPaymentPercent', downPaymentPercent);
  nonNegative('closingCosts', closingCosts);
  nonNegative('repairCosts', repairCosts);
  nonNegative('monthlyRent', monthlyRent);
  nonNegative('otherMonthlyIncome', otherMonthlyIncome);
  percent('vacancyPercent', vacancyPercent);
  for (const [name, value] of Object.entries({ propertyTaxYearly, insuranceYearly, hoaMonthly, utilitiesMonthly })) nonNegative(name, value);
  for (const [name, value] of Object.entries({ maintenancePercent, capexPercent, managementPercent })) percent(name, value);

  const loanAmount = purchasePrice * (1 - downPaymentPercent / 100);
  const downPayment = purchasePrice - loanAmount;
  let monthlyDebtPayment = 0;
  if (loanAmount > 0) {
    finite('termYears', termYears);
    if (!Number.isInteger(termYears) || termYears <= 0) throw new RangeError('termYears must be a positive whole number');
    monthlyDebtPayment = monthlyPayment({ principal: loanAmount, annualRate: interestRate, termMonths: termYears * 12 });
  }
  const annualDebtService = 12 * monthlyDebtPayment;

  const grossScheduledIncome = 12 * (monthlyRent + otherMonthlyIncome);
  const vacancyLoss = grossScheduledIncome * vacancyPercent / 100;
  const effectiveGrossIncome = grossScheduledIncome - vacancyLoss;

  const percentShare = (maintenancePercent + capexPercent + managementPercent) / 100;
  const expenses = {
    propertyTax: propertyTaxYearly,
    insurance: insuranceYearly,
    hoa: 12 * hoaMonthly,
    utilities: 12 * utilitiesMonthly,
    maintenance: effectiveGrossIncome * maintenancePercent / 100,
    capitalReserve: effectiveGrossIncome * capexPercent / 100,
    management: effectiveGrossIncome * managementPercent / 100
  };
  const fixedExpenses = expenses.propertyTax + expenses.insurance + expenses.hoa + expenses.utilities;
  const operatingExpenses = Object.values(expenses).reduce((sum, value) => sum + value, 0);
  const netOperatingIncome = effectiveGrossIncome - operatingExpenses;
  const annualCashFlow = netOperatingIncome - annualDebtService;
  const cashInvested = downPayment + closingCosts + repairCosts;

  // Cash flow is linear in rent: 12(R + other)(1 − v)(1 − p) − fixed − debt service.
  const collectedShare = (1 - vacancyPercent / 100) * (1 - percentShare);
  const breakEvenRent = collectedShare > 0
    ? Math.max(0, (fixedExpenses + annualDebtService) / (12 * collectedShare) - otherMonthlyIncome)
    : null;

  return {
    purchasePrice,
    loanAmount,
    downPayment,
    monthlyDebtPayment,
    annualDebtService,
    grossScheduledIncome,
    vacancyLoss,
    effectiveGrossIncome,
    expenses,
    operatingExpenses,
    netOperatingIncome,
    capRate: netOperatingIncome / purchasePrice,
    annualCashFlow,
    monthlyCashFlow: annualCashFlow / 12,
    cashInvested,
    cashOnCash: cashInvested > 0 ? annualCashFlow / cashInvested : null,
    dscr: annualDebtService > 0 ? netOperatingIncome / annualDebtService : null,
    grossRentMultiplier: grossScheduledIncome > 0 ? purchasePrice / grossScheduledIncome : null,
    expenseRatio: effectiveGrossIncome > 0 ? operatingExpenses / effectiveGrossIncome : null,
    breakEvenRent
  };
}

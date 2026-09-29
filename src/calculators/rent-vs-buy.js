/**
 * Rent vs. buy comparison. Simulates both paths month by month and reports
 * net worth each year:
 *
 * - Buyer: pays the down payment and closing costs up front, then principal
 *   and interest (from the shared mortgage engine), PMI while required,
 *   property tax and maintenance as a share of the current home value,
 *   insurance and HOA dues. Net worth = home value − loan balance − selling
 *   costs + the buyer's investments.
 * - Renter: invests the buyer's up-front cash instead, pays rent (raised once a
 *   year) and renters insurance. Net worth = the renter's investments.
 * - Each month, whichever path costs less invests the difference, so both
 *   paths spend the same cash. Investments grow at a monthly rate that
 *   compounds to the annual return.
 *
 * Income taxes (mortgage interest deduction, capital gains) are not modeled.
 */

import { calculateMortgagePayment } from './mortgage-payment.js';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

const monthlyGrowth = (annualPercent) => (1 + annualPercent / 100) ** (1 / 12) - 1;

export function calculateRentVsBuy({
  homePrice,
  downPayment,
  annualRate,
  termMonths,
  years,
  buyClosingCostPercent = 0,
  sellingCostPercent = 0,
  propertyTaxPercent = 0,
  insuranceYearly = 0,
  maintenancePercent = 0,
  hoaMonthly = 0,
  pmiRate = 0,
  appreciationPercent = 0,
  monthlyRent,
  rentIncreasePercent = 0,
  rentersInsuranceMonthly = 0,
  investmentReturnPercent = 0
}) {
  for (const [name, value] of Object.entries({
    buyClosingCostPercent, sellingCostPercent, propertyTaxPercent, insuranceYearly, maintenancePercent,
    hoaMonthly, pmiRate, monthlyRent, rentIncreasePercent, rentersInsuranceMonthly
  })) nonNegative(name, value);
  finite('appreciationPercent', appreciationPercent);
  finite('investmentReturnPercent', investmentReturnPercent);
  if (appreciationPercent <= -100 || investmentReturnPercent <= -100) throw new RangeError('growth rates must be greater than -100%');
  if (!Number.isInteger(years) || years <= 0) throw new RangeError('years must be a positive whole number');

  const mortgage = calculateMortgagePayment({ homePrice, downPayment, annualRate, termMonths, pmiRate });
  const homeGrowth = monthlyGrowth(appreciationPercent);
  const investGrowth = monthlyGrowth(investmentReturnPercent);
  const upfront = downPayment + homePrice * buyClosingCostPercent / 100;

  let homeValue = homePrice;
  let buyerInvestments = 0;
  let renterInvestments = upfront;
  let buyerCosts = upfront;
  let renterCosts = 0;
  let rent = monthlyRent;
  const rows = [];
  let firstMonth = null;

  for (let month = 1; month <= years * 12; month += 1) {
    if (month > 1 && (month - 1) % 12 === 0) rent *= 1 + rentIncreasePercent / 100;
    const scheduled = mortgage.schedule[month - 1];
    const principalAndInterest = scheduled ? scheduled.payment : 0;
    const pmi = month <= mortgage.pmi.months ? mortgage.pmi.monthly : 0;
    // Value-based costs use the value at the start of the month.
    const ownerExtras = homeValue * (propertyTaxPercent + maintenancePercent) / 100 / 12 + insuranceYearly / 12 + hoaMonthly;
    const buyCost = principalAndInterest + pmi + ownerExtras;
    const rentCost = rent + rentersInsuranceMonthly;
    if (firstMonth === null) firstMonth = { buyCost, rentCost, principalAndInterest, pmi, ownerExtras, rent };

    buyerInvestments *= 1 + investGrowth;
    renterInvestments *= 1 + investGrowth;
    if (buyCost > rentCost) renterInvestments += buyCost - rentCost;
    else buyerInvestments += rentCost - buyCost;
    buyerCosts += buyCost;
    renterCosts += rentCost;
    homeValue *= 1 + homeGrowth;

    if (month % 12 === 0) {
      const balance = scheduled ? scheduled.balance : 0;
      const sellingCosts = homeValue * sellingCostPercent / 100;
      rows.push({
        year: month / 12,
        homeValue,
        loanBalance: balance,
        homeEquityAfterSale: homeValue - balance - sellingCosts,
        buyerInvestments,
        buyerNetWorth: homeValue - balance - sellingCosts + buyerInvestments,
        renterNetWorth: renterInvestments,
        buyerCosts,
        renterCosts
      });
    }
  }

  const breakeven = rows.find((row) => row.buyerNetWorth >= row.renterNetWorth) ?? null;
  const last = rows.at(-1);
  return {
    mortgage: { loanAmount: mortgage.loanAmount, monthlyPayment: mortgage.monthly.principalAndInterest, pmiMonthly: mortgage.pmi.monthly, pmiMonths: mortgage.pmi.months },
    upfront,
    firstMonth,
    rows,
    breakevenYear: breakeven ? breakeven.year : null,
    advantage: last.buyerNetWorth - last.renterNetWorth
  };
}

/**
 * Car lease payment and a lease-vs-buy comparison over the lease term.
 *
 * Lease payment (the standard method the CFPB describes: depreciation plus a
 * rent charge, plus tax, spread over the term):
 *   adjusted capitalized cost = price + capitalized fees − down payment − net trade-in
 *   residual value            = MSRP × residual %
 *   depreciation              = (adjusted cap cost − residual) ÷ months
 *   rent charge               = (adjusted cap cost + residual) × money factor
 *   monthly payment           = (depreciation + rent charge) × (1 + tax rate on payments)
 * The money factor is the APR ÷ 2,400.
 *
 * Buying is modeled with the shared auto-loan engine on the same price, down
 * payment and trade-in. At the end of the lease term the buyer owns a car
 * assumed to be worth the lease's residual value and still owes the loan
 * balance, so its net cost over the term = cash paid − (residual − balance).
 */

import { calculateAutoLoan } from './auto-loan.js';

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

export const moneyFactorFromApr = (apr) => apr / 2400;

export function calculateCarLease({
  msrp,
  price,
  residualPercent,
  leaseApr,
  leaseMonths,
  downPayment = 0,
  tradeInValue = 0,
  tradeInPayoff = 0,
  capitalizedFees = 0,
  upfrontFees = 0,
  paymentTaxPercent = 0,
  loanApr,
  loanMonths,
  purchaseTaxPercent = 0
}) {
  for (const [name, value] of Object.entries({ msrp, price, residualPercent, leaseApr, downPayment, tradeInValue, tradeInPayoff, capitalizedFees, upfrontFees, paymentTaxPercent, loanApr, purchaseTaxPercent })) {
    nonNegative(name, value);
  }
  if (msrp <= 0 || price <= 0) throw new RangeError('msrp and price must be greater than 0');
  if (residualPercent >= 100) throw new RangeError('residualPercent must be less than 100');
  if (!Number.isInteger(leaseMonths) || leaseMonths <= 0) throw new RangeError('leaseMonths must be a positive whole number');
  if (!Number.isInteger(loanMonths) || loanMonths < leaseMonths) throw new RangeError('loanMonths must be a whole number at least as long as the lease');

  const netTradeIn = tradeInValue - tradeInPayoff;
  const adjustedCapCost = price + capitalizedFees - downPayment - netTradeIn;
  const residual = msrp * residualPercent / 100;
  if (adjustedCapCost <= residual) throw new RangeError('the adjusted capitalized cost must be more than the residual value');
  const moneyFactor = moneyFactorFromApr(leaseApr);
  const depreciation = (adjustedCapCost - residual) / leaseMonths;
  const rentCharge = (adjustedCapCost + residual) * moneyFactor;
  const basePayment = depreciation + rentCharge;
  const tax = basePayment * paymentTaxPercent / 100;
  const leasePayment = basePayment + tax;
  const leaseCashOut = downPayment + upfrontFees + leasePayment * leaseMonths;

  const loan = calculateAutoLoan({
    vehiclePrice: price, downPayment, tradeInValue, tradeInPayoff, salesTaxRate: purchaseTaxPercent,
    fees: capitalizedFees, annualRate: loanApr, termMonths: loanMonths
  });
  const balanceAtLeaseEnd = loan.schedule[leaseMonths - 1]?.balance ?? 0;
  const paymentsDuringLease = loan.schedule.slice(0, leaseMonths).reduce((sum, row) => sum + row.payment, 0);
  const buyCashOut = downPayment + upfrontFees + paymentsDuringLease;
  const equityAtLeaseEnd = residual - balanceAtLeaseEnd;
  const buyNetCost = buyCashOut - equityAtLeaseEnd;

  return {
    lease: {
      adjustedCapCost, residual, moneyFactor, depreciation, rentCharge, basePayment, tax, payment: leasePayment,
      totalRentCharge: rentCharge * leaseMonths, dueAtSigning: downPayment + upfrontFees + leasePayment, cashOut: leaseCashOut
    },
    buy: {
      amountFinanced: loan.amountFinanced, salesTax: loan.salesTax, payment: loan.monthlyPayment, paymentsDuringLease,
      balanceAtLeaseEnd, equityAtLeaseEnd, cashOut: buyCashOut, netCost: buyNetCost
    },
    leaseMonths,
    // Positive: leasing costs more over the lease term than buying (after counting the buyer's equity).
    leaseMinusBuy: leaseCashOut - buyNetCost
  };
}

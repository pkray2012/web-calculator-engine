/**
 * Reverse US auto-loan calculations: monthly payment budget -> maximum vehicle price.
 * Reuses the generic fixed-rate loan math and the existing auto-loan tax/trade rules.
 */

import { monthlyPayment } from './loan-payment.js';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  nonNegative(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

/**
 * Calculate the maximum vehicle price supported by a target monthly principal-and-interest payment.
 *
 * The result mirrors calculateAutoLoan(): sales tax is either applied to the full vehicle price or,
 * when taxAfterTradeIn is true, to max(0, vehiclePrice - tradeInValue). Fees are financed and
 * down payment/trade equity reduce the amount financed.
 */
export function calculateAutoLoanAffordability({
  monthlyBudget,
  annualRate,
  termMonths,
  downPayment = 0,
  tradeInValue = 0,
  tradeInPayoff = 0,
  salesTaxRate = 0,
  fees = 0,
  taxAfterTradeIn = false
}) {
  positive('monthlyBudget', monthlyBudget);
  finite('annualRate', annualRate);
  if (annualRate < 0) throw new RangeError('annualRate cannot be negative');
  if (!Number.isInteger(termMonths) || termMonths <= 0) {
    throw new RangeError('termMonths must be a positive integer');
  }
  nonNegative('downPayment', downPayment);
  nonNegative('tradeInValue', tradeInValue);
  nonNegative('tradeInPayoff', tradeInPayoff);
  nonNegative('salesTaxRate', salesTaxRate);
  nonNegative('fees', fees);

  const netTradeIn = tradeInValue - tradeInPayoff;
  const taxRate = salesTaxRate / 100;
  const supportedPrincipal = monthlyBudget / monthlyPayment({
    principal: 1,
    annualRate,
    termMonths
  });
  const fixedOffset = fees - downPayment - netTradeIn;

  let vehiclePrice;
  if (!taxAfterTradeIn) {
    vehiclePrice = (supportedPrincipal - fixedOffset) / (1 + taxRate);
  } else {
    const belowTradePrice = supportedPrincipal - fixedOffset;
    const aboveTradePrice = (supportedPrincipal - fixedOffset + taxRate * tradeInValue) / (1 + taxRate);
    vehiclePrice = belowTradePrice <= tradeInValue ? belowTradePrice : aboveTradePrice;
  }

  if (vehiclePrice <= 0) {
    throw new RangeError('monthlyBudget is too low for the supplied fees, down payment, and trade inputs');
  }

  const taxableBase = taxAfterTradeIn
    ? Math.max(0, vehiclePrice - tradeInValue)
    : vehiclePrice;
  const salesTax = taxableBase * taxRate;
  const amountFinanced = vehiclePrice + salesTax + fees - downPayment - netTradeIn;

  if (amountFinanced <= 0) {
    throw new RangeError('amountFinanced must be greater than 0 for the supplied affordability inputs');
  }

  const monthlyPaymentResult = monthlyPayment({
    principal: amountFinanced,
    annualRate,
    termMonths
  });

  return {
    monthlyBudget,
    annualRate,
    termMonths,
    vehiclePrice,
    downPayment,
    tradeInValue,
    tradeInPayoff,
    netTradeIn,
    salesTaxRate,
    salesTax,
    fees,
    taxAfterTradeIn,
    amountFinanced,
    monthlyPayment: monthlyPaymentResult
  };
}

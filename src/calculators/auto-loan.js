/**
 * US auto-loan calculations built on the generic fixed-rate loan engine.
 * Tax/fee treatment is explicit so UI code does not duplicate financing rules.
 */

import { calculateLoan } from './loan-payment.js';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/**
 * Calculate amount financed and the resulting amortizing loan.
 *
 * vehiclePrice: negotiated vehicle price before tax/fees.
 * downPayment: cash paid at purchase.
 * tradeInValue/tradeInPayoff: trade-in equity components.
 * salesTaxRate: percentage applied to the taxable purchase base.
 * taxAfterTradeIn: if true, tax base is reduced by trade-in value, but never below zero.
 * fees: dealer/title/registration/etc. amount financed.
 */
export function calculateAutoLoan({
  vehiclePrice,
  downPayment = 0,
  tradeInValue = 0,
  tradeInPayoff = 0,
  salesTaxRate = 0,
  fees = 0,
  taxAfterTradeIn = false,
  annualRate,
  termMonths,
  extraMonthly = 0
}) {
  nonNegative('vehiclePrice', vehiclePrice);
  if (vehiclePrice <= 0) throw new RangeError('vehiclePrice must be greater than 0');
  nonNegative('downPayment', downPayment);
  nonNegative('tradeInValue', tradeInValue);
  nonNegative('tradeInPayoff', tradeInPayoff);
  nonNegative('salesTaxRate', salesTaxRate);
  nonNegative('fees', fees);

  const netTradeIn = tradeInValue - tradeInPayoff;
  const taxableBase = taxAfterTradeIn
    ? Math.max(0, vehiclePrice - tradeInValue)
    : vehiclePrice;
  const salesTax = taxableBase * (salesTaxRate / 100);
  const amountFinanced = vehiclePrice + salesTax + fees - downPayment - netTradeIn;

  if (amountFinanced <= 0) {
    // The down payment may cover taxes and fees, so only the net amount is checked.
    throw new RangeError('downPayment and trade-in equity cover the full purchase; amountFinanced must be greater than 0');
  }

  const loan = calculateLoan({
    principal: amountFinanced,
    annualRate,
    termMonths,
    extraMonthly
  });

  return {
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
    ...loan
  };
}

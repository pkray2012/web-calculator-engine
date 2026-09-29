/**
 * Adapter between the Auto Loan Calculator page and the auto-loan engines.
 * Parses raw form values, calls calculateAutoLoan() and compareAutoLoanTerms(),
 * and shapes the result for display. No financial formulas live here.
 */

import { calculateAutoLoan } from '../calculators/auto-loan.js';
import { compareAutoLoanTerms } from '../calculators/auto-loan-term-comparison.js';
import { calculateAutoLoanAffordability } from '../calculators/auto-loan-affordability.js';
import { numberField, monthField } from '../lib/validation.js';
import { amortizedView } from './amortized-view.js';

export const AUTO_LIMITS = Object.freeze({
  maxPrice: 10_000_000,
  maxTaxRate: 20,
  maxRate: 100,
  maxTermMonths: 120
});

/** Illustrative example values; the page labels them as an example, not market data. */
export const AUTO_DEFAULTS = Object.freeze({
  mode: 'price',
  vehiclePrice: '35000',
  monthlyBudget: '600',
  downPayment: '5000',
  tradeInValue: '0',
  tradeInPayoff: '0',
  salesTaxRate: '6',
  taxAfterTradeIn: '',
  fees: '0',
  annualRate: '7',
  termMonths: '60',
  extraMonthly: '0',
  startMonth: ''
});

/** Common US auto-loan terms shown in the comparison, in months. */
export const AUTO_COMPARISON_TERMS = Object.freeze([36, 48, 60, 72, 84]);

export function parseAutoForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, required = true) => take(field, numberField(values[field], {
    label, required, fallback: 0, min: 0, max: AUTO_LIMITS.maxPrice
  }));

  const mode = values.mode === 'budget' ? 'budget' : 'price';
  const vehiclePrice = mode === 'price'
    ? take('vehiclePrice', numberField(values.vehiclePrice, { label: 'Vehicle price', min: 0, minExclusive: true, max: AUTO_LIMITS.maxPrice }))
    : null;
  const monthlyBudget = mode === 'budget'
    ? take('monthlyBudget', numberField(values.monthlyBudget, { label: 'Monthly budget', min: 0, minExclusive: true, max: AUTO_LIMITS.maxPrice }))
    : null;
  const downPayment = money('downPayment', 'Down payment', false);
  const tradeInValue = money('tradeInValue', 'Trade-in value', false);
  const tradeInPayoff = money('tradeInPayoff', 'Amount owed on trade-in', false);
  const salesTaxRate = take('salesTaxRate', numberField(values.salesTaxRate, {
    label: 'Sales tax rate', required: false, fallback: 0, min: 0, max: AUTO_LIMITS.maxTaxRate
  }));
  const fees = money('fees', 'Fees', false);
  const annualRate = take('annualRate', numberField(values.annualRate, {
    label: 'APR', min: 0, max: AUTO_LIMITS.maxRate
  }));
  const termMonths = take('termMonths', numberField(values.termMonths, {
    label: 'Loan term', min: 0, minExclusive: true, max: AUTO_LIMITS.maxTermMonths, integer: true
  }));
  const extraMonthly = money('extraMonthly', 'Extra monthly payment', false);
  const startMonth = take('startMonth', monthField(values.startMonth, { label: 'First payment month' }));
  const taxAfterTradeIn = values.taxAfterTradeIn === 'on' || values.taxAfterTradeIn === 'true';

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: {
      mode, vehiclePrice, monthlyBudget, downPayment, tradeInValue, tradeInPayoff, salesTaxRate, taxAfterTradeIn,
      fees, annualRate, termMonths, extraMonthly, startMonth
    }
  };
}

function comparisonTerms(selected) {
  return [...new Set([...AUTO_COMPARISON_TERMS, selected])].sort((a, b) => a - b);
}

export function buildAutoView(input) {
  const budget = input.mode === 'budget'
    ? calculateAutoLoanAffordability({
      monthlyBudget: input.monthlyBudget,
      annualRate: input.annualRate,
      termMonths: input.termMonths,
      downPayment: input.downPayment,
      tradeInValue: input.tradeInValue,
      tradeInPayoff: input.tradeInPayoff,
      salesTaxRate: input.salesTaxRate,
      fees: input.fees,
      taxAfterTradeIn: input.taxAfterTradeIn
    })
    : null;
  const purchase = {
    vehiclePrice: budget ? budget.vehiclePrice : input.vehiclePrice,
    downPayment: input.downPayment,
    tradeInValue: input.tradeInValue,
    tradeInPayoff: input.tradeInPayoff,
    salesTaxRate: input.salesTaxRate,
    taxAfterTradeIn: input.taxAfterTradeIn,
    fees: input.fees,
    annualRate: input.annualRate
  };
  const loan = calculateAutoLoan({ ...purchase, termMonths: input.termMonths, extraMonthly: input.extraMonthly });
  const comparison = compareAutoLoanTerms({ ...purchase, terms: comparisonTerms(input.termMonths) });

  const view = amortizedView({
    loan,
    input: {
      principal: loan.amountFinanced,
      annualRate: input.annualRate,
      termMonths: input.termMonths,
      extraMonthly: input.extraMonthly,
      startMonth: input.startMonth
    },
    termComparison: comparison.rows.map((row) => ({
      termMonths: row.termMonths,
      monthlyPayment: row.monthlyPayment,
      totalInterest: row.totalInterest,
      selected: row.termMonths === input.termMonths
    }))
  });

  return {
    ...view,
    budget: budget ? { monthlyBudget: budget.monthlyBudget, vehiclePrice: budget.vehiclePrice } : null,
    purchase: {
      vehiclePrice: loan.vehiclePrice,
      salesTaxRate: loan.salesTaxRate,
      taxAfterTradeIn: loan.taxAfterTradeIn,
      salesTax: loan.salesTax,
      fees: loan.fees,
      downPayment: loan.downPayment,
      tradeInValue: loan.tradeInValue,
      tradeInPayoff: loan.tradeInPayoff,
      netTradeIn: loan.netTradeIn,
      amountFinanced: loan.amountFinanced,
      carCostWithInterest: loan.vehiclePrice + loan.salesTax + loan.fees + loan.totalInterest
    }
  };
}

/**
 * Parse, validate and calculate in one step. Engine range errors become
 * field errors instead of exceptions.
 */
export function runAutoCalculator(values) {
  const parsed = parseAutoForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildAutoView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    if (/monthlyBudget is too low/.test(error.message)) {
      return {
        ok: false,
        errors: { monthlyBudget: 'This budget does not cover the fees and any amount owed on your trade-in after your down payment. Raise the budget or lower those amounts.' }
      };
    }
    if (/amountFinanced|downPayment/.test(error.message)) {
      return {
        ok: false,
        errors: { downPayment: 'Your down payment and trade-in equity cover the full price, tax and fees, so there is nothing to finance.' }
      };
    }
    return {
      ok: false,
      errors: { annualRate: 'This rate and term are too extreme to calculate. Try a lower rate or a shorter term.' }
    };
  }
}

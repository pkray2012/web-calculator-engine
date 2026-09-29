/**
 * Adapter between the Debt-to-Income Ratio Calculator page and its engine.
 * Parses raw form values, calls calculateDebtToIncome() and shapes the result
 * for display. No financial formulas live here.
 */

import { calculateDebtToIncome } from '../calculators/debt-to-income.js';
import { numberField } from '../lib/validation.js';

export const DTI_LIMITS = Object.freeze({ maxMoney: 10_000_000 });

/** The other monthly debt payments, in form order. */
export const DTI_DEBTS = Object.freeze([
  { field: 'autoPayment', label: 'Auto loans' },
  { field: 'studentPayment', label: 'Student loans' },
  { field: 'cardPayment', label: 'Credit card minimums' },
  { field: 'personalPayment', label: 'Personal and other loans' },
  { field: 'supportPayment', label: 'Child support or alimony' }
]);

/** Illustrative example values; the page labels them as an example. */
export const DTI_DEFAULTS = Object.freeze({
  incomeValue: '72000',
  incomeUnit: 'year',
  housingPayment: '1800',
  autoPayment: '420',
  studentPayment: '250',
  cardPayment: '120',
  personalPayment: '',
  supportPayment: '',
  targetPercent: '36'
});

export function parseDtiForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, rules = {}) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: DTI_LIMITS.maxMoney, ...rules }));
  const incomeUnit = values.incomeUnit === 'month' ? 'month' : 'year';
  const income = money('incomeValue', 'Gross income', { required: true, minExclusive: true });
  const housingPayment = money('housingPayment', 'Housing payment');
  const debts = DTI_DEBTS.map((debt) => ({ label: debt.label, amount: money(debt.field, debt.label) }));
  const targetPercent = take('targetPercent', numberField(values.targetPercent, { label: 'Target ratio', min: 1, max: 100 }));
  if (Object.keys(errors).length) return { ok: false, errors };
  const grossMonthlyIncome = incomeUnit === 'year' ? income / 12 : income;
  return { ok: true, input: { incomeUnit, income, grossMonthlyIncome, housingPayment, debts, targetPercent } };
}

export function buildDtiView(input) {
  const result = calculateDebtToIncome({
    grossMonthlyIncome: input.grossMonthlyIncome,
    housingPayment: input.housingPayment,
    otherDebts: input.debts,
    targetPercent: input.targetPercent
  });
  return { input, ...result, overTarget: result.reductionNeeded > 0 };
}

/** Parse, validate and calculate. */
export function runDtiCalculator(values) {
  const parsed = parseDtiForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildDtiView(parsed.input) };
}

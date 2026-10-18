/**
 * Adapter between the Rental Property Calculator page and its engine. Parses
 * raw form values, calls the engine and shapes the result for display.
 * No formulas live here.
 */

import { calculateRentalProperty } from '../calculators/rental-property.js';
import { numberField } from '../lib/validation.js';

/** Illustrative example values, not market data: a $300,000 single-family rental. */
export const RENTAL_DEFAULTS = Object.freeze({
  purchasePrice: '300000',
  downPaymentPercent: '25',
  closingCosts: '9000',
  repairCosts: '6000',
  interestRate: '7',
  termYears: '30',
  monthlyRent: '2400',
  otherMonthlyIncome: '0',
  vacancyPercent: '5',
  propertyTaxYearly: '3600',
  insuranceYearly: '1500',
  hoaMonthly: '0',
  utilitiesMonthly: '0',
  maintenancePercent: '8',
  capexPercent: '5',
  managementPercent: '5'
});

const MONEY_MAX = 1_000_000_000;

export function parseRentalForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, required = false) => take(field, numberField(values[field], { label, required, fallback: 0, min: 0, max: MONEY_MAX }));
  const pct = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: 100 }));

  const purchasePrice = take('purchasePrice', numberField(values.purchasePrice, { label: 'Purchase price', min: 0, minExclusive: true, max: MONEY_MAX }));
  const downPaymentPercent = take('downPaymentPercent', numberField(values.downPaymentPercent, { label: 'Down payment', min: 0, max: 100 }));
  const closingCosts = money('closingCosts', 'Closing costs');
  const repairCosts = money('repairCosts', 'Upfront repairs');
  const allCash = downPaymentPercent === 100;
  const interestRate = allCash ? 0 : take('interestRate', numberField(values.interestRate, { label: 'Interest rate', min: 0, max: 30 }));
  const termYears = allCash ? 30 : take('termYears', numberField(values.termYears, { label: 'Loan term', min: 1, max: 40, integer: true }));
  const monthlyRent = money('monthlyRent', 'Monthly rent', true);
  const otherMonthlyIncome = money('otherMonthlyIncome', 'Other monthly income');
  const vacancyPercent = pct('vacancyPercent', 'Vacancy');
  const propertyTaxYearly = money('propertyTaxYearly', 'Property tax');
  const insuranceYearly = money('insuranceYearly', 'Insurance');
  const hoaMonthly = money('hoaMonthly', 'HOA dues');
  const utilitiesMonthly = money('utilitiesMonthly', 'Utilities you pay');
  const maintenancePercent = pct('maintenancePercent', 'Maintenance');
  const capexPercent = pct('capexPercent', 'Capital reserve');
  const managementPercent = pct('managementPercent', 'Property management');
  if (!errors.maintenancePercent && !errors.capexPercent && !errors.managementPercent
    && maintenancePercent + capexPercent + managementPercent > 100) {
    errors.managementPercent = 'Maintenance, capital reserve and management together cannot be more than 100% of rent.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: {
      purchasePrice, downPaymentPercent, closingCosts, repairCosts, interestRate, termYears, monthlyRent, otherMonthlyIncome,
      vacancyPercent, propertyTaxYearly, insuranceYearly, hoaMonthly, utilitiesMonthly, maintenancePercent, capexPercent, managementPercent
    }
  };
}

export function buildRentalView(input) {
  return { input, result: calculateRentalProperty(input) };
}

/** Parse, validate and calculate. */
export function runRentalCalculator(values) {
  const parsed = parseRentalForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildRentalView(parsed.input) };
}

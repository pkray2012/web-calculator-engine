/**
 * Full monthly mortgage payment: principal and interest from the shared loan
 * engine, plus property tax, homeowners insurance, private mortgage insurance
 * (PMI) and HOA dues. PMI is modelled as an annual rate on the original loan
 * amount, charged until the scheduled balance first reaches 78% of the home's
 * original value (automatic termination under the Homeowners Protection Act);
 * the month it first reaches 80% (when a borrower can ask to cancel) is also
 * reported. Taxes, insurance and PMI rates are user inputs, never assumed.
 */

import { calculateLoan } from './loan-payment.js';

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/** First payment after which the scheduled balance is at or below `share` of the home value, or null. */
function firstMonthAtOrBelow(schedule, homePrice, share) {
  const row = schedule.find((entry) => entry.balance <= homePrice * share + 1e-9);
  return row ? row.month : null;
}

export function calculateMortgagePayment({
  homePrice,
  downPayment,
  annualRate,
  termMonths,
  propertyTaxYearly = 0,
  insuranceYearly = 0,
  pmiRate = 0,
  hoaMonthly = 0
}) {
  nonNegative('homePrice', homePrice);
  if (homePrice <= 0) throw new RangeError('homePrice must be greater than 0');
  nonNegative('downPayment', downPayment);
  if (downPayment >= homePrice) throw new RangeError('downPayment must be less than homePrice');
  for (const [name, value] of Object.entries({ propertyTaxYearly, insuranceYearly, pmiRate, hoaMonthly })) nonNegative(name, value);

  const loanAmount = homePrice - downPayment;
  const loan = calculateLoan({ principal: loanAmount, annualRate, termMonths });
  const ltv = loanAmount / homePrice * 100;

  // PMI applies only above 80% LTV; it stops once the scheduled balance reaches 78% of the original value.
  const needsPmi = ltv > 80 && pmiRate > 0;
  const pmiMonthly = needsPmi ? loanAmount * pmiRate / 100 / 12 : 0;
  const canRequestMonth = ltv > 80 ? firstMonthAtOrBelow(loan.schedule, homePrice, 0.8) : null;
  const autoEndMonth = ltv > 80 ? firstMonthAtOrBelow(loan.schedule, homePrice, 0.78) : null;
  // PMI is charged with each payment while the balance before it is still above 78%.
  const pmiMonths = needsPmi ? (autoEndMonth ?? termMonths) : 0;

  const taxMonthly = propertyTaxYearly / 12;
  const insuranceMonthly = insuranceYearly / 12;
  const monthly = {
    principalAndInterest: loan.monthlyPayment,
    propertyTax: taxMonthly,
    insurance: insuranceMonthly,
    pmi: pmiMonthly,
    hoa: hoaMonthly
  };
  const total = monthly.principalAndInterest + taxMonthly + insuranceMonthly + pmiMonthly + hoaMonthly;

  return {
    loanAmount,
    downPayment,
    downPaymentPercent: downPayment / homePrice * 100,
    ltv,
    monthly,
    totalMonthly: total,
    totalMonthlyAfterPmi: total - pmiMonthly,
    pmi: {
      required: ltv > 80,
      monthly: pmiMonthly,
      canRequestMonth,
      autoEndMonth,
      months: pmiMonths,
      total: pmiMonthly * pmiMonths
    },
    totalInterest: loan.totalInterest,
    payments: loan.scheduledPayments,
    finalPayment: loan.schedule.at(-1).payment,
    schedule: loan.schedule,
    // Everything paid over the full term: down payment, principal and interest, PMI, taxes, insurance and HOA.
    lifetimeCost: downPayment + loan.totalRepayment + pmiMonthly * pmiMonths + (taxMonthly + insuranceMonthly + hoaMonthly) * loan.scheduledPayments
  };
}

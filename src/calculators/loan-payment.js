/**
 * Fixed-rate monthly loan calculations.
 * Presentation/UI code should consume these pure functions rather than reimplementing formulas.
 */

function assertFiniteNumber(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function validateLoanInputs({ principal, annualRate, termMonths }) {
  assertFiniteNumber('principal', principal);
  assertFiniteNumber('annualRate', annualRate);
  assertFiniteNumber('termMonths', termMonths);

  if (principal <= 0) throw new RangeError('principal must be greater than 0');
  if (annualRate < 0) throw new RangeError('annualRate cannot be negative');
  if (!Number.isInteger(termMonths) || termMonths <= 0) {
    throw new RangeError('termMonths must be a positive integer');
  }
}

/**
 * Calculate the required monthly payment for a fixed-rate amortizing loan.
 * annualRate is expressed as a percentage, e.g. 6.5 means 6.5% APR.
 */
export function monthlyPayment({ principal, annualRate, termMonths }) {
  validateLoanInputs({ principal, annualRate, termMonths });

  if (annualRate === 0) return principal / termMonths;

  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Build a complete monthly amortization schedule.
 * The final payment is capped at the remaining balance plus that month's interest.
 */
export function amortizationSchedule({ principal, annualRate, termMonths, extraMonthly = 0 }) {
  validateLoanInputs({ principal, annualRate, termMonths });
  assertFiniteNumber('extraMonthly', extraMonthly);
  if (extraMonthly < 0) throw new RangeError('extraMonthly cannot be negative');

  const basePayment = monthlyPayment({ principal, annualRate, termMonths });
  const payment = basePayment + extraMonthly;
  const monthlyRate = annualRate / 100 / 12;
  const rows = [];
  let balance = principal;

  for (let month = 1; month <= termMonths && balance > 0.005; month += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(balance, Math.max(0, payment - interest));
    const actualPayment = interest + principalPaid;

    balance = Math.max(0, balance - principalPaid);

    rows.push({
      month,
      payment: actualPayment,
      principal: principalPaid,
      interest,
      balance
    });

    if (principalPaid <= 0) {
      throw new RangeError('payment is insufficient to reduce the balance');
    }
  }

  return rows;
}

export function calculateLoan({ principal, annualRate, termMonths, extraMonthly = 0 }) {
  validateLoanInputs({ principal, annualRate, termMonths });
  assertFiniteNumber('extraMonthly', extraMonthly);
  if (extraMonthly < 0) throw new RangeError('extraMonthly cannot be negative');

  const basePayment = monthlyPayment({ principal, annualRate, termMonths });
  const baseSchedule = amortizationSchedule({ principal, annualRate, termMonths });
  const acceleratedSchedule = extraMonthly > 0
    ? amortizationSchedule({ principal, annualRate, termMonths, extraMonthly })
    : baseSchedule;

  const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);

  return {
    monthlyPayment: basePayment,
    totalInterest: sum(baseSchedule, 'interest'),
    totalRepayment: sum(baseSchedule, 'payment'),
    scheduledPayments: baseSchedule.length,
    schedule: baseSchedule,
    extraPayment: extraMonthly,
    accelerated: {
      monthlyPayment: basePayment + extraMonthly,
      payments: acceleratedSchedule.length,
      totalInterest: sum(acceleratedSchedule, 'interest'),
      totalRepayment: sum(acceleratedSchedule, 'payment'),
      interestSaved: sum(baseSchedule, 'interest') - sum(acceleratedSchedule, 'interest'),
      paymentsSaved: baseSchedule.length - acceleratedSchedule.length,
      schedule: acceleratedSchedule
    }
  };
}

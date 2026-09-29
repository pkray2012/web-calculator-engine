/**
 * HELOC payment and payment-shock calculations.
 *
 * This is an educational fixed-rate snapshot of a variable-rate HELOC. It models
 * the common two-phase structure without pretending to reproduce a lender's
 * contract, index, margin, floor, cap or minimum-payment rules.
 */
import { monthlyPayment, amortizationSchedule } from './loan-payment.js';

function assertFiniteNumber(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function validate({ balance, annualRate, drawMonths, repaymentMonths, drawPaymentType }) {
  assertFiniteNumber('balance', balance);
  assertFiniteNumber('annualRate', annualRate);
  assertFiniteNumber('drawMonths', drawMonths);
  assertFiniteNumber('repaymentMonths', repaymentMonths);
  if (balance <= 0) throw new RangeError('balance must be greater than 0');
  if (annualRate < 0) throw new RangeError('annualRate cannot be negative');
  if (!Number.isInteger(drawMonths) || drawMonths <= 0) throw new RangeError('drawMonths must be a positive integer');
  if (!Number.isInteger(repaymentMonths) || repaymentMonths <= 0) throw new RangeError('repaymentMonths must be a positive integer');
  if (!['interestOnly', 'principalAndInterest'].includes(drawPaymentType)) {
    throw new RangeError('drawPaymentType must be interestOnly or principalAndInterest');
  }
}

function interestOnlyPayment(balance, annualRate) {
  return balance * annualRate / 100 / 12;
}

function scheduleSummary(rows) {
  return {
    endingBalance: rows.at(-1)?.balance ?? 0,
    totalInterest: rows.reduce((sum, row) => sum + row.interest, 0),
    totalPayments: rows.reduce((sum, row) => sum + row.payment, 0)
  };
}

/**
 * Calculate a HELOC's draw payment, repayment payment and payment shock.
 * The rate is held constant for the base case; use rateScenarios for stress cases.
 */
export function calculateHeloc({
  balance,
  annualRate,
  drawMonths,
  repaymentMonths,
  drawPaymentType = 'interestOnly',
  rateScenarios = []
}) {
  validate({ balance, annualRate, drawMonths, repaymentMonths, drawPaymentType });
  if (!Array.isArray(rateScenarios)) throw new RangeError('rateScenarios must be an array');
  for (const rate of rateScenarios) {
    assertFiniteNumber('rateScenario', rate);
    if (rate < 0) throw new RangeError('rateScenario cannot be negative');
  }

  const drawPayment = drawPaymentType === 'interestOnly'
    ? interestOnlyPayment(balance, annualRate)
    : monthlyPayment({ principal: balance, annualRate, termMonths: drawMonths + repaymentMonths });

  const drawSchedule = drawPaymentType === 'interestOnly'
    ? Array.from({ length: drawMonths }, (_, index) => ({
      month: index + 1,
      payment: drawPayment,
      principal: 0,
      interest: drawPayment,
      balance
    }))
    : amortizationSchedule({
      principal: balance,
      annualRate,
      termMonths: drawMonths + repaymentMonths
    }).slice(0, drawMonths);

  const drawSummary = scheduleSummary(drawSchedule);
  const repaymentStartingBalance = drawSummary.endingBalance;
  const repaymentPayment = monthlyPayment({
    principal: repaymentStartingBalance,
    annualRate,
    termMonths: repaymentMonths
  });
  const repaymentSchedule = amortizationSchedule({
    principal: repaymentStartingBalance,
    annualRate,
    termMonths: repaymentMonths
  });
  const repaymentSummary = scheduleSummary(repaymentSchedule);
  const paymentShock = repaymentPayment - drawPayment;
  const paymentShockPercent = drawPayment === 0 ? null : paymentShock / drawPayment * 100;

  const scenarios = [annualRate, ...rateScenarios].map((rate) => {
    const scenarioDrawPayment = drawPaymentType === 'interestOnly'
      ? interestOnlyPayment(balance, rate)
      : monthlyPayment({ principal: balance, annualRate: rate, termMonths: drawMonths + repaymentMonths });
    const scenarioDrawSchedule = drawPaymentType === 'interestOnly'
      ? null
      : amortizationSchedule({ principal: balance, annualRate: rate, termMonths: drawMonths + repaymentMonths }).slice(0, drawMonths);
    const scenarioBalance = drawPaymentType === 'interestOnly'
      ? balance
      : scheduleSummary(scenarioDrawSchedule).endingBalance;
    const scenarioRepaymentPayment = monthlyPayment({ principal: scenarioBalance, annualRate: rate, termMonths: repaymentMonths });
    return {
      annualRate: rate,
      drawPayment: scenarioDrawPayment,
      repaymentPayment: scenarioRepaymentPayment,
      paymentShock: scenarioRepaymentPayment - scenarioDrawPayment,
      paymentShockPercent: scenarioDrawPayment === 0 ? null : (scenarioRepaymentPayment - scenarioDrawPayment) / scenarioDrawPayment * 100
    };
  });

  return {
    balance,
    annualRate,
    drawMonths,
    repaymentMonths,
    drawPaymentType,
    drawPayment,
    repaymentPayment,
    repaymentStartingBalance,
    paymentShock,
    paymentShockPercent,
    totalInterest: drawSummary.totalInterest + repaymentSummary.totalInterest,
    totalPayments: drawSummary.totalPayments + repaymentSummary.totalPayments,
    drawInterest: drawSummary.totalInterest,
    repaymentInterest: repaymentSummary.totalInterest,
    scenarios,
    drawSchedule,
    repaymentSchedule
  };
}

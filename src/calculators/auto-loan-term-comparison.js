import { calculateAutoLoan } from './auto-loan.js';

function validateTerms(terms) {
  if (!Array.isArray(terms) || terms.length === 0) throw new RangeError('terms must contain at least one term in months');
  for (const term of terms) {
    if (!Number.isFinite(term) || !Number.isInteger(term) || term <= 0) throw new RangeError('termMonths must be a positive integer');
  }
  if (new Set(terms).size !== terms.length) throw new RangeError('terms must not contain duplicates');
  return terms;
}

/**
 * @param {{ terms: number[] } & Omit<Parameters<typeof calculateAutoLoan>[0], 'termMonths'>} params
 */
export function compareAutoLoanTerms({ terms, ...loanInputs }) {
  const normalizedTerms = validateTerms(terms);
  const baselineTerm = Math.min(...normalizedTerms);
  const baseline = calculateAutoLoan({ ...loanInputs, termMonths: baselineTerm });
  const rows = normalizedTerms.map((termMonths) => {
    const result = calculateAutoLoan({ ...loanInputs, termMonths });
    return {
      termMonths,
      monthlyPayment: result.monthlyPayment,
      scheduledPayments: result.scheduledPayments,
      totalInterest: result.totalInterest,
      totalLoanCost: result.totalRepayment,
      interestDeltaVsShortestTerm: result.totalInterest - baseline.totalInterest,
      monthlyPaymentDeltaVsShortestTerm: result.monthlyPayment - baseline.monthlyPayment
    };
  });
  return { baselineTerm, amountFinanced: baseline.amountFinanced, rows };
}
